import { useEffect, useMemo, useState } from 'react'
import ResourceManager from '../components/shared/ResourceManager'
import { useCrudResource } from '../hooks/useCrudResource'
import { driversService } from '../services/driversService'
import { usersService } from '../services/usersService'

const emptyForm = {
  user_id: '',
  license_number: '',
  license_expiry: '',
  status: 'active',
}

function getDriverId(driver) {
  return driver.driver_id ?? driver.id
}

function getUserId(user) {
  return user.user_id ?? user.id
}

export default function DriversPage() {
  const { items, loading, submitting, error, success, setSuccess, runAction } =
    useCrudResource(driversService)
  const [formData, setFormData] = useState(emptyForm)
  const [editingItem, setEditingItem] = useState(null)
  const [driverUsers, setDriverUsers] = useState([])
  const [usersError, setUsersError] = useState('')

  useEffect(() => {
    async function loadDriverUsers() {
      try {
        const result = await usersService.list()
        const filteredUsers = Array.isArray(result)
          ? result.filter((user) => user.role === 'Driver')
          : []

        setDriverUsers(filteredUsers)
      } catch (loadError) {
        setUsersError(loadError.message)
      }
    }

    loadDriverUsers()
  }, [])

  const driverUserOptions = useMemo(() => {
    const selectedUserId = editingItem?.user_id != null ? String(editingItem.user_id) : null
    const availableUsers = driverUsers.filter(
      (user) =>
        !items.some(
          (driver) =>
            String(driver.user_id) === String(getUserId(user)) &&
            String(driver.user_id) !== selectedUserId,
        ),
    )

    return availableUsers.map((user) => ({
      value: String(getUserId(user)),
      label: `${user.full_name} (${user.username})`,
    }))
  }, [driverUsers, items, editingItem])

  const rows = useMemo(
    () =>
      items.map((driver) => ({
        ...driver,
        __uiId: getDriverId(driver),
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
      user_id: Number(formData.user_id),
      license_number: formData.license_number.trim(),
      license_expiry: formData.license_expiry,
      status: formData.status,
    }

    if (!payload.user_id || !payload.license_number || !payload.license_expiry || !payload.status) {
      return
    }

    const didSave = editingItem
      ? await runAction(
          () => driversService.update(getDriverId(editingItem), payload),
          'Driver profile updated successfully.',
        )
      : await runAction(
          () => driversService.create(payload),
          'Driver profile created successfully.',
        )

    if (didSave) {
      resetForm()
    }

    return didSave
  }

  function handleEdit(driver) {
    setSuccess('')
    setEditingItem(driver)
    setFormData({
      user_id: String(driver.user_id ?? ''),
      license_number: driver.license_number ?? '',
      license_expiry: driver.license_expiry?.slice(0, 10) ?? '',
      status: driver.status ?? 'active',
    })
  }

  async function handleDelete(driver) {
    const didDelete = await runAction(
      () => driversService.remove(getDriverId(driver)),
      'Driver profile deleted successfully.',
    )

    if (didDelete && editingItem && getDriverId(editingItem) === getDriverId(driver)) {
      resetForm()
    }
  }

  return (
    <ResourceManager
      title="Driver"
      helperText="Link each driver profile to an existing user account whose role is already set to Driver."
      fields={[
        {
          name: 'user_id',
          label: 'Driver user',
          type: 'select',
          options: driverUserOptions,
          required: true,
          placeholder: 'Select driver user',
        },
        {
          name: 'license_number',
          label: 'License number',
          placeholder: 'Enter license number',
          required: true,
        },
        {
          name: 'license_expiry',
          label: 'License expiry',
          type: 'date',
          required: true,
        },
        {
          name: 'status',
          label: 'Driver status',
          type: 'select',
          required: true,
          options: [
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'suspended', label: 'Suspended' },
          ],
        },
      ]}
      columns={[
        {
          key: 'driver_id',
          label: 'Identifier',
          render: (row) => row.driver_id ?? row.id ?? 'N/A',
        },
        { key: 'full_name', label: 'Driver Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'license_number', label: 'License Number' },
        { key: 'license_expiry', label: 'License Expiry' },
        {
          key: 'status',
          label: 'Status',
          render: (row) => (
            <span className={`status-pill ${String(row.status ?? '').toLowerCase()}`}>
              {row.status}
            </span>
          ),
        },
      ]}
      items={rows}
      loading={loading}
      submitting={submitting}
      error={error || usersError}
      success={success}
      formData={formData}
      editingItem={editingItem}
      emptyMessage="No driver profiles found yet. Create Driver users first, then assign their license data here."
      onChange={handleChange}
      onSubmit={handleSubmit}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCancelEdit={resetForm}
    />
  )
}
