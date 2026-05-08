import { useEffect, useMemo, useState } from 'react'
import ResourceManager from '../components/shared/ResourceManager'
import { useCrudResource } from '../hooks/useCrudResource'
import { useAuth } from '../hooks/useAuth'
import { bookingsService } from '../services/bookingsService'
import { citiesService } from '../services/citiesService'
import { routesService } from '../services/routesService'

const emptyForm = {
  route_id: '',
  seat_count: '1',
  booking_status: 'pending',
  notes: '',
}

function getBookingId(booking) {
  return booking.booking_id ?? booking.id
}

function getRouteLabel(route, cityMap) {
  const origin = route.origin_city ?? route.origin_name ?? cityMap[String(route.origin_id)] ?? route.origin_id
  const destination =
    route.destination_city ??
    route.destination_name ??
    cityMap[String(route.dest_id)] ??
    route.dest_id
  return `${origin} -> ${destination}`
}

export default function BookingsPage() {
  const { user } = useAuth()
  const { items, loading, submitting, error, success, setSuccess, runAction } =
    useCrudResource(bookingsService)
  const [formData, setFormData] = useState(emptyForm)
  const [editingItem, setEditingItem] = useState(null)
  const [routes, setRoutes] = useState([])
  const [cities, setCities] = useState([])
  const [routesError, setRoutesError] = useState('')

  const isAdmin = user?.role === 'Admin'

  useEffect(() => {
    async function loadLookups() {
      try {
        const [routesResult, citiesResult] = await Promise.all([
          routesService.list(),
          citiesService.list(),
        ])

        setRoutes(Array.isArray(routesResult) ? routesResult : [])
        setCities(Array.isArray(citiesResult) ? citiesResult : [])
        setRoutesError('')
      } catch (loadError) {
        setRoutesError(loadError.message)
      }
    }

    loadLookups()
  }, [])

  const cityMap = useMemo(
    () =>
      cities.reduce((map, city) => {
        map[String(city.city_id ?? city.id)] = city.city_name
        return map
      }, {}),
    [cities],
  )

  const routeOptions = useMemo(
    () =>
      routes.map((route) => ({
        value: String(route.route_id ?? route.id),
        label: getRouteLabel(route, cityMap),
      })),
    [routes, cityMap],
  )

  const rows = useMemo(
    () =>
      items.map((booking) => ({
        ...booking,
        __uiId: getBookingId(booking),
      })),
    [items],
  )

  function resetForm() {
    setFormData(emptyForm)
    setEditingItem(null)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const payload = {
      route_id: Number(formData.route_id),
      seat_count: Number(formData.seat_count),
      notes: formData.notes.trim(),
    }

    if (isAdmin) {
      payload.booking_status = formData.booking_status
    }

    if (!payload.route_id || !payload.seat_count) {
      return
    }

    const didSave = editingItem
      ? await runAction(
          () => bookingsService.update(getBookingId(editingItem), payload),
          'Booking updated successfully.',
        )
      : await runAction(
          () => bookingsService.create(payload),
          'Booking created successfully.',
        )

    if (didSave) {
      resetForm()
    }

    return didSave
  }

  function handleEdit(booking) {
    setSuccess('')
    setEditingItem(booking)
    setFormData({
      route_id: String(booking.route_id ?? ''),
      seat_count: String(booking.seat_count ?? 1),
      booking_status: booking.booking_status ?? 'pending',
      notes: booking.notes ?? '',
    })
  }

  async function handleDelete(booking) {
    const didDelete = await runAction(
      () => bookingsService.remove(getBookingId(booking)),
      'Booking deleted successfully.',
    )

    if (didDelete && editingItem && getBookingId(editingItem) === getBookingId(booking)) {
      resetForm()
    }
  }

  const fields = [
    {
      name: 'route_id',
      label: 'Route',
      type: 'select',
      options: routeOptions,
      required: true,
      placeholder: 'Select route',
    },
    {
      name: 'seat_count',
      label: 'Seat count',
      type: 'number',
      min: 1,
      step: 1,
      required: true,
      placeholder: 'Number of seats',
    },
  ]

  if (isAdmin) {
    fields.push({
      name: 'booking_status',
      label: 'Booking status',
      type: 'select',
      required: true,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'assigned', label: 'Assigned' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'completed', label: 'Completed' },
      ],
    })
  }

  fields.push({
    name: 'notes',
    label: 'Notes',
    placeholder: 'Optional booking notes',
  })

  const columns = [
    {
      key: 'booking_id',
      label: 'Identifier',
      render: (row) => row.booking_id ?? row.id ?? 'N/A',
    },
    {
      key: 'route_id',
      label: 'Route',
      render: (row) =>
        row.origin_city && row.destination_city
          ? `${row.origin_city} -> ${row.destination_city}`
          : getRouteLabel(row, cityMap),
    },
  ]

  if (isAdmin) {
    columns.push({ key: 'customer_name', label: 'Customer' })
  }

  columns.push(
    { key: 'seat_count', label: 'Seats' },
    {
      key: 'trip_id',
      label: 'Trip',
      render: (row) => row.trip_id ?? 'Pending planning',
    },
    {
      key: 'booking_status',
      label: 'Status',
      render: (row) => (
        <span className={`status-pill ${String(row.booking_status ?? '').toLowerCase()}`}>
          {row.booking_status ?? 'N/A'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Booked On',
      render: (row) => row.created_at?.slice?.(0, 10) ?? row.created_at ?? 'N/A',
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (row) => row.notes || 'None',
    },
  )

  return (
    <ResourceManager
      title="Booking"
      helperText={
        isAdmin
          ? 'Review pending demand by route and keep customer bookings organized before planning trips.'
          : 'Choose a route and reserve your seats so an admin can later assign your booking to a planned trip.'
      }
      fields={fields}
      columns={columns}
      items={rows}
      loading={loading}
      submitting={submitting}
      error={error || routesError}
      success={success}
      formData={formData}
      editingItem={editingItem}
      emptyMessage={
        isAdmin
          ? 'No bookings found yet. Customer demand will appear here once bookings start coming in.'
          : 'No bookings found yet. Create your first route booking to get started.'
      }
      onChange={handleChange}
      onSubmit={handleSubmit}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCancelEdit={resetForm}
    />
  )
}
