import { useMemo, useState } from 'react'
import ResourceManager from '../components/shared/ResourceManager'
import { useCrudResource } from '../hooks/useCrudResource'
import { usersService } from '../services/usersService'

const emptyForm = {
  full_name: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  role: 'Customer',
  is_active: 'true',
}

function getUserId(user) {
  return user.user_id ?? user.id
}

export default function UsersPage() {
  const { items, loading, submitting, error, success, setSuccess, runAction } =
    useCrudResource(usersService)
  const [formData, setFormData] = useState(emptyForm)
  const [editingItem, setEditingItem] = useState(null)

  const rows = useMemo(
    () =>
      items.map((user) => ({
        ...user,
        __uiId: getUserId(user),
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
      full_name: formData.full_name.trim(),
      username: formData.username.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      role: formData.role,
      is_active: formData.is_active === 'true',
    }

    if (formData.password.trim()) {
      payload.password = formData.password
    }

    if (
      !payload.full_name ||
      !payload.username ||
      !payload.email ||
      !payload.phone ||
      (!editingItem && !payload.password)
    ) {
      return
    }

    const didSave = editingItem
      ? await runAction(
          () => usersService.update(getUserId(editingItem), payload),
          'User updated successfully.',
        )
      : await runAction(
          () => usersService.create(payload),
          'User created successfully.',
        )

    if (didSave) {
      resetForm()
    }

    return didSave
  }

  function handleEdit(user) {
    setSuccess('')
    setEditingItem(user)
    setFormData({
      full_name: user.full_name ?? '',
      username: user.username ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      password: '',
      role: user.role ?? 'Customer',
      is_active: String(Boolean(user.is_active)),
    })
  }

  async function handleDelete(user) {
    const didDelete = await runAction(
      () => usersService.remove(getUserId(user)),
      'User deleted successfully.',
    )

    if (didDelete && editingItem && getUserId(editingItem) === getUserId(user)) {
      resetForm()
    }
  }

  return (
    <ResourceManager
      title="User"
      helperText="Create staff and customer accounts here after logging into the dashboard."
      fields={[
        {
          name: 'full_name',
          label: 'Full name',
          placeholder: 'Enter full name',
          required: true,
        },
        {
          name: 'username',
          label: 'Username',
          placeholder: 'Choose a username',
          required: true,
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          placeholder: 'Enter email address',
          required: true,
        },
        {
          name: 'phone',
          label: 'Phone',
          type: 'tel',
          placeholder: 'Enter phone number',
          required: true,
        },
        {
          name: 'password',
          label: editingItem ? 'New password (optional)' : 'Password',
          type: 'password',
          placeholder: editingItem ? 'Leave empty to keep current password' : 'Create password',
          required: !editingItem,
        },
        {
          name: 'role',
          label: 'Role',
          type: 'select',
          required: true,
          options: [
            { value: 'Customer', label: 'Customer' },
            { value: 'Driver', label: 'Driver' },
            { value: 'Admin', label: 'Admin' },
          ],
        },
        {
          name: 'is_active',
          label: 'Account status',
          type: 'select',
          required: true,
          options: [
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Blocked' },
          ],
        },
      ]}
      columns={[
        {
          key: 'user_id',
          label: 'Identifier',
          render: (row) => row.user_id ?? row.id ?? 'N/A',
        },
        { key: 'full_name', label: 'Full Name' },
        { key: 'username', label: 'Username' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'role', label: 'Role' },
        {
          key: 'is_active',
          label: 'Status',
          render: (row) => (
            <span className={`status-pill ${row.is_active ? 'active' : 'blocked'}`}>
              {row.is_active ? 'Active' : 'Blocked'}
            </span>
          ),
        },
      ]}
      items={rows}
      loading={loading}
      submitting={submitting}
      error={error}
      success={success}
      formData={formData}
      editingItem={editingItem}
      emptyMessage="No users found yet. Add the first managed account from this dashboard."
      onChange={handleChange}
      onSubmit={handleSubmit}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCancelEdit={resetForm}
    />
  )
}
