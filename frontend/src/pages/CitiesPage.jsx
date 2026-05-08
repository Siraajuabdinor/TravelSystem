import { useMemo, useState } from 'react';
import ResourceManager from '../components/shared/ResourceManager';
import { useCrudResource } from '../hooks/useCrudResource';
import { citiesService } from '../services/citiesService';

const emptyForm = {
  city_name: '',
};

function getCityId(city) {
  return city.city_id ?? city.id;
}

export default function CitiesPage() {
  const { items, loading, submitting, error, success, setSuccess, runAction } =
    useCrudResource(citiesService);
  const [formData, setFormData] = useState(emptyForm);
  const [editingItem, setEditingItem] = useState(null);

  const rows = useMemo(
    () =>
      items.map((city) => ({
        ...city,
        __uiId: getCityId(city),
      })),
    [items],
  );

  function resetForm() {
    setFormData(emptyForm);
    setEditingItem(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const payload = { city_name: formData.city_name.trim() };

    if (!payload.city_name) {
      return;
    }

    const didSave = editingItem
      ? await runAction(
        () => citiesService.update(getCityId(editingItem), payload),
        'City updated successfully.',
      )
      : await runAction(
        () => citiesService.create(payload),
        'City created successfully.',
      );

    if (didSave) {
      resetForm();
    }

    return didSave;
  }

  function handleEdit(city) {
    setSuccess('');
    setEditingItem(city);
    setFormData({
      city_name: city.city_name ?? '',
    });
  }

  async function handleDelete(city) {
    const didDelete = await runAction(
      () => citiesService.remove(getCityId(city)),
      'City deleted successfully.',
    );

    if (didDelete && editingItem && getCityId(editingItem) === getCityId(city)) {
      resetForm();
    }
  }

  return (
    <ResourceManager
      title="City"
      helperText="Use city records as the base data for routes and later trip scheduling."
      fields={[
        {
          name: 'city_name',
          label: 'City name',
          placeholder: 'Enter city name',
          required: true,
        },
      ]}
      columns={[
        { key: 'city_name', label: 'City Name' },
        {
          key: 'city_id',
          label: 'Identifier',
          render: (row) => row.city_id ?? row.id ?? 'N/A',
        },
      ]}
      items={rows}
      loading={loading}
      submitting={submitting}
      error={error}
      success={success}
      formData={formData}
      editingItem={editingItem}
      emptyMessage="No cities found yet. Add the first city from the form."
      onChange={handleChange}
      onSubmit={handleSubmit}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCancelEdit={resetForm}
    />
  );
}
