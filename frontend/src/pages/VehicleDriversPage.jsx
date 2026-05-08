import { useEffect, useMemo, useState } from 'react'
import ResourceManager from '../components/shared/ResourceManager'
import { useCrudResource } from '../hooks/useCrudResource'
import { driversService } from '../services/driversService'
import { vehicleDriversService } from '../services/vehicleDriversService'
import { vehiclesService } from '../services/vehiclesService'

const emptyForm = {
  vehicle_id: '',
  driver_id: '',
  start_date: '',
  end_date: '',
}

function getAssignmentId(assignment) {
  return assignment.vd_id ?? assignment.id
}

function getVehicleId(vehicle) {
  return vehicle.vehicle_id ?? vehicle.id
}

function getDriverId(driver) {
  return driver.driver_id ?? driver.id
}

export default function VehicleDriversPage() {
  const { items, loading, submitting, error, success, setSuccess, runAction } =
    useCrudResource(vehicleDriversService)
  const [formData, setFormData] = useState(emptyForm)
  const [editingItem, setEditingItem] = useState(null)
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [lookupError, setLookupError] = useState('')

  useEffect(() => {
    async function loadLookups() {
      try {
        const [vehiclesResult, driversResult] = await Promise.all([
          vehiclesService.list(),
          driversService.list(),
        ])

        setVehicles(Array.isArray(vehiclesResult) ? vehiclesResult : [])
        setDrivers(Array.isArray(driversResult) ? driversResult : [])
        setLookupError('')
      } catch (loadError) {
        setLookupError(loadError.message)
      }
    }

    loadLookups()
  }, [])

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((vehicle) => ({
        value: String(getVehicleId(vehicle)),
        label: `${vehicle.plate_number} - ${vehicle.vehicle_type}`,
      })),
    [vehicles],
  )

  const driverOptions = useMemo(
    () =>
      drivers.map((driver) => ({
        value: String(getDriverId(driver)),
        label: `${driver.full_name} - ${driver.license_number}`,
      })),
    [drivers],
  )

  const rows = useMemo(
    () =>
      items.map((assignment) => ({
        ...assignment,
        __uiId: getAssignmentId(assignment),
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
      vehicle_id: Number(formData.vehicle_id),
      driver_id: Number(formData.driver_id),
      start_date: formData.start_date,
      end_date: formData.end_date || null,
    }

    if (!payload.vehicle_id || !payload.driver_id || !payload.start_date) {
      return
    }

    const didSave = editingItem
      ? await runAction(
          () => vehicleDriversService.update(getAssignmentId(editingItem), payload),
          'Vehicle assignment updated successfully.',
        )
      : await runAction(
          () => vehicleDriversService.create(payload),
          'Vehicle assignment created successfully.',
        )

    if (didSave) {
      resetForm()
    }

    return didSave
  }

  function handleEdit(assignment) {
    setSuccess('')
    setEditingItem(assignment)
    setFormData({
      vehicle_id: String(assignment.vehicle_id ?? ''),
      driver_id: String(assignment.driver_id ?? ''),
      start_date: assignment.start_date?.slice(0, 10) ?? '',
      end_date: assignment.end_date?.slice(0, 10) ?? '',
    })
  }

  async function handleDelete(assignment) {
    const didDelete = await runAction(
      () => vehicleDriversService.remove(getAssignmentId(assignment)),
      'Vehicle assignment deleted successfully.',
    )

    if (didDelete && editingItem && getAssignmentId(editingItem) === getAssignmentId(assignment)) {
      resetForm()
    }
  }

  return (
    <ResourceManager
      title="Vehicle Assignment"
      helperText="Connect each vehicle to a driver and track when the assignment starts or ends."
      fields={[
        {
          name: 'vehicle_id',
          label: 'Vehicle',
          type: 'select',
          options: vehicleOptions,
          required: true,
          placeholder: 'Select vehicle',
        },
        {
          name: 'driver_id',
          label: 'Driver',
          type: 'select',
          options: driverOptions,
          required: true,
          placeholder: 'Select driver',
        },
        {
          name: 'start_date',
          label: 'Start date',
          type: 'date',
          required: true,
        },
        {
          name: 'end_date',
          label: 'End date',
          type: 'date',
        },
      ]}
      columns={[
        {
          key: 'vd_id',
          label: 'Identifier',
          render: (row) => row.vd_id ?? row.id ?? 'N/A',
        },
        { key: 'plate_number', label: 'Plate Number' },
        { key: 'vehicle_type', label: 'Vehicle Type' },
        { key: 'driver_name', label: 'Driver Name' },
        { key: 'license_number', label: 'License Number' },
        {
          key: 'driver_status',
          label: 'Driver Status',
          render: (row) => (
            <span className={`status-pill ${String(row.driver_status ?? '').toLowerCase()}`}>
              {row.driver_status ?? 'N/A'}
            </span>
          ),
        },
        {
          key: 'start_date',
          label: 'Start Date',
          render: (row) => row.start_date?.slice?.(0, 10) ?? row.start_date ?? 'N/A',
        },
        {
          key: 'end_date',
          label: 'End Date',
          render: (row) => row.end_date?.slice?.(0, 10) ?? row.end_date ?? 'Active',
        },
      ]}
      items={rows}
      loading={loading}
      submitting={submitting}
      error={error || lookupError}
      success={success}
      formData={formData}
      editingItem={editingItem}
      emptyMessage="No vehicle assignments found yet. Add one to connect a driver with a vehicle."
      onChange={handleChange}
      onSubmit={handleSubmit}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCancelEdit={resetForm}
    />
  )
}
