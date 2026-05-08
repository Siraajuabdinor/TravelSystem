import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarRange, MapPinned, Route as RouteIcon, Users } from 'lucide-react'
import { bookingsService } from '../services/bookingsService'
import { citiesService } from '../services/citiesService'
import { routesService } from '../services/routesService'
import { tripsService } from '../services/tripsService'
import { vehicleDriversService } from '../services/vehicleDriversService'
import { useCrudResource } from '../hooks/useCrudResource'

const emptyForm = {
  route_id: '',
  vd_id: '',
  trip_date: '',
  departure_datetime: '',
  arrival_datetime: '',
  capacity: '25',
  trip_status: 'planned',
  notes: '',
}

function getTripId(trip) {
  return trip.trip_id ?? trip.id
}

function formatDateTimeLocal(value) {
  if (!value) {
    return ''
  }

  return String(value).replace(' ', 'T').slice(0, 16)
}

function formatDateOnly(value) {
  return value?.slice?.(0, 10) ?? value ?? ''
}

export default function TripsPage() {
  const { items, loading, submitting, error, success, setSuccess, runAction } =
    useCrudResource(tripsService)
  const [formData, setFormData] = useState(emptyForm)
  const [editingItem, setEditingItem] = useState(null)
  const [selectedBookingIds, setSelectedBookingIds] = useState([])
  const [routes, setRoutes] = useState([])
  const [cities, setCities] = useState([])
  const [assignments, setAssignments] = useState([])
  const [bookings, setBookings] = useState([])
  const [lookupError, setLookupError] = useState('')

  const loadLookups = useCallback(async () => {
    try {
      const [routesResult, citiesResult, assignmentsResult, bookingsResult] = await Promise.all([
        routesService.list(),
        citiesService.list(),
        vehicleDriversService.list(),
        bookingsService.list(),
      ])

      setRoutes(Array.isArray(routesResult) ? routesResult : [])
      setCities(Array.isArray(citiesResult) ? citiesResult : [])
      setAssignments(Array.isArray(assignmentsResult) ? assignmentsResult : [])
      setBookings(Array.isArray(bookingsResult) ? bookingsResult : [])
      setLookupError('')
    } catch (loadError) {
      setLookupError(loadError.message)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLookups()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadLookups])

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
        label: `${cityMap[String(route.origin_id)] ?? route.origin_id} -> ${cityMap[String(route.dest_id)] ?? route.dest_id}`,
      })),
    [routes, cityMap],
  )

  const assignmentOptions = useMemo(
    () =>
      assignments.map((assignment) => ({
        value: String(assignment.vd_id ?? assignment.id),
        label: `${assignment.plate_number} - ${assignment.driver_name}`,
      })),
    [assignments],
  )

  const tripRows = useMemo(
    () =>
      items.map((trip) => ({
        ...trip,
        __uiId: getTripId(trip),
      })),
    [items],
  )

  const currentTripId = editingItem ? getTripId(editingItem) : null
  const activeRouteId = formData.route_id

  const availableBookings = useMemo(
    () =>
      bookings.filter((booking) => {
        if (!activeRouteId || String(booking.route_id) !== String(activeRouteId)) {
          return false
        }

        if (booking.booking_status === 'pending') {
          return true
        }

        return currentTripId != null && String(booking.trip_id) === String(currentTripId)
      }),
    [bookings, activeRouteId, currentTripId],
  )

  const selectedBookings = useMemo(
    () =>
      availableBookings.filter((booking) =>
        selectedBookingIds.includes(Number(booking.booking_id ?? booking.id)),
      ),
    [availableBookings, selectedBookingIds],
  )

  const selectedSeats = useMemo(
    () => selectedBookings.reduce((sum, booking) => sum + Number(booking.seat_count ?? 0), 0),
    [selectedBookings],
  )

  function resetForm() {
    setFormData(emptyForm)
    setEditingItem(null)
    setSelectedBookingIds([])
  }

  function handleChange(event) {
    const { name, value } = event.target

    if (name === 'route_id' && value !== formData.route_id) {
      setSelectedBookingIds([])
    }

    setFormData((current) => ({ ...current, [name]: value }))
  }

  function handleBookingToggle(bookingId) {
    setSelectedBookingIds((current) =>
      current.includes(bookingId)
        ? current.filter((value) => value !== bookingId)
        : [...current, bookingId],
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const payload = {
      route_id: Number(formData.route_id),
      vd_id: Number(formData.vd_id),
      trip_date: formData.trip_date,
      departure_datetime: formData.departure_datetime,
      arrival_datetime: formData.arrival_datetime || null,
      capacity: Number(formData.capacity),
      trip_status: formData.trip_status,
      notes: formData.notes.trim(),
      booking_ids: selectedBookingIds,
    }

    if (
      !payload.route_id ||
      !payload.vd_id ||
      !payload.trip_date ||
      !payload.departure_datetime ||
      !payload.capacity ||
      payload.booking_ids.length === 0
    ) {
      return
    }

    const didSave = editingItem
      ? await runAction(
          () => tripsService.update(getTripId(editingItem), payload),
          'Trip updated successfully.',
        )
      : await runAction(
          () => tripsService.create(payload),
          'Trip created successfully.',
        )

    if (didSave) {
      await loadLookups()
      resetForm()
    }

    return didSave
  }

  function handleEdit(trip) {
    setSuccess('')
    setEditingItem(trip)
    setFormData({
      route_id: String(trip.route_id ?? ''),
      vd_id: String(trip.vd_id ?? ''),
      trip_date: formatDateOnly(trip.trip_date),
      departure_datetime: formatDateTimeLocal(trip.departure_datetime),
      arrival_datetime: formatDateTimeLocal(trip.arrival_datetime),
      capacity: String(trip.capacity ?? 25),
      trip_status: trip.trip_status ?? 'planned',
      notes: trip.notes ?? '',
    })

    const tripBookingIds = bookings
      .filter((booking) => String(booking.trip_id) === String(getTripId(trip)))
      .map((booking) => Number(booking.booking_id ?? booking.id))

    setSelectedBookingIds(tripBookingIds)
  }

  async function handleDelete(trip) {
    const didDelete = await runAction(
      () => tripsService.remove(getTripId(trip)),
      'Trip deleted successfully.',
    )

    if (didDelete) {
      await loadLookups()
    }

    if (didDelete && editingItem && getTripId(editingItem) === getTripId(trip)) {
      resetForm()
    }
  }

  return (
    <div className="dashboard-stack trips-page">
      {(error || lookupError) && <div className="form-message error">{error || lookupError}</div>}
      {success && <div className="form-message success">{success}</div>}

      <div className="page-grid trips-grid">
        <section className="panel panel-table dashboard-card">
          <div className="panel-header">
            <div>
              <h2>Trips</h2>
              <p>Plan operational trips from route demand, then keep the assigned bookings grouped together.</p>
            </div>
            <div className="panel-header-actions">
              <div className="panel-chip neutral">
                <RouteIcon size={16} />
                <span>{tripRows.length} trips</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading planned trips...</div>
          ) : tripRows.length === 0 ? (
            <div className="empty-state">No trips planned yet. Select route bookings below to create the first trip.</div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Date</th>
                    <th>Departure</th>
                    <th>Seats</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tripRows.map((trip) => (
                    <tr key={trip.__uiId}>
                      <td>{trip.trip_id ?? 'N/A'}</td>
                      <td>{`${trip.origin_city} -> ${trip.destination_city}`}</td>
                      <td>{trip.plate_number ?? 'N/A'}</td>
                      <td>{trip.driver_name ?? 'N/A'}</td>
                      <td>{formatDateOnly(trip.trip_date) || 'N/A'}</td>
                      <td>{formatDateTimeLocal(trip.departure_datetime).replace('T', ' ') || 'N/A'}</td>
                      <td>{`${trip.booked_seats ?? 0}/${trip.capacity ?? 0}`}</td>
                      <td>
                        <span className={`status-pill ${String(trip.trip_status ?? '').toLowerCase()}`}>
                          {trip.trip_status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-link" type="button" onClick={() => handleEdit(trip)}>
                            Edit
                          </button>
                          <button
                            className="btn-link danger"
                            type="button"
                            onClick={() => handleDelete(trip)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel panel-form dashboard-card">
          <div className="panel-header">
            <div>
              <h2>{editingItem ? 'Edit Trip' : 'Plan Trip'}</h2>
              <p>Pick one route, assign a vehicle-driver pair, then attach the matching pending bookings.</p>
            </div>
            <div className="panel-header-actions">
              <div className="panel-chip neutral">
                <Users size={16} />
                <span>{selectedBookingIds.length} bookings selected</span>
              </div>
              <div className="panel-chip neutral">
                <CalendarRange size={16} />
                <span>{selectedSeats} seats reserved</span>
              </div>
            </div>
          </div>

          <form className="resource-form" onSubmit={handleSubmit}>
            <div className="resource-form-grid">
              <label className="form-field">
                <span className="form-label">Route</span>
                <select name="route_id" value={formData.route_id} onChange={handleChange} required>
                  <option value="">Select route</option>
                  {routeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span className="form-label">Vehicle assignment</span>
                <select name="vd_id" value={formData.vd_id} onChange={handleChange} required>
                  <option value="">Select assignment</option>
                  {assignmentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field">
                <span className="form-label">Trip date</span>
                <input type="date" name="trip_date" value={formData.trip_date} onChange={handleChange} required />
              </label>

              <label className="form-field">
                <span className="form-label">Departure</span>
                <input
                  type="datetime-local"
                  name="departure_datetime"
                  value={formData.departure_datetime}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="form-field">
                <span className="form-label">Arrival</span>
                <input
                  type="datetime-local"
                  name="arrival_datetime"
                  value={formData.arrival_datetime}
                  onChange={handleChange}
                />
              </label>

              <label className="form-field">
                <span className="form-label">Capacity</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="form-field">
                <span className="form-label">Trip status</span>
                <select
                  name="trip_status"
                  value={formData.trip_status}
                  onChange={handleChange}
                  required
                >
                  <option value="planned">Planned</option>
                  <option value="ready">Ready</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label className="form-field trips-notes-field">
                <span className="form-label">Notes</span>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Optional trip notes"
                />
              </label>
            </div>

            <div className="trips-booking-picker">
              <div className="trips-selection-summary">
                <div className="panel-chip">
                  <MapPinned size={16} />
                  <span>{activeRouteId ? routeOptions.find((option) => option.value === activeRouteId)?.label ?? 'Route selected' : 'Select a route first'}</span>
                </div>
                <div className="panel-chip neutral">
                  <Users size={16} />
                  <span>{selectedSeats} / {formData.capacity || 0} seats</span>
                </div>
              </div>

              {activeRouteId ? (
                availableBookings.length === 0 ? (
                  <div className="empty-state">No pending bookings found for the selected route.</div>
                ) : (
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Select</th>
                          <th>Booking</th>
                          <th>Customer</th>
                          <th>Seats</th>
                          <th>Status</th>
                          <th>Booked On</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {availableBookings.map((booking) => {
                          const bookingId = Number(booking.booking_id ?? booking.id)
                          const checked = selectedBookingIds.includes(bookingId)

                          return (
                            <tr key={bookingId}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => handleBookingToggle(bookingId)}
                                />
                              </td>
                              <td>{booking.booking_id ?? 'N/A'}</td>
                              <td>{booking.customer_name ?? 'N/A'}</td>
                              <td>{booking.seat_count ?? 0}</td>
                              <td>
                                <span
                                  className={`status-pill ${String(booking.booking_status ?? '').toLowerCase()}`}
                                >
                                  {booking.booking_status}
                                </span>
                              </td>
                              <td>{formatDateOnly(booking.created_at) || 'N/A'}</td>
                              <td>{booking.notes || 'None'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              ) : (
                <div className="empty-state">Choose a route to see pending bookings available for this trip.</div>
              )}
            </div>

            <div className="form-actions">
              <button className="btn-primary form-submit-btn" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : editingItem ? 'Update Trip' : 'Create Trip'}
              </button>
              <button className="btn-secondary form-cancel-btn" type="button" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
