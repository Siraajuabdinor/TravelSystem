import { useMemo, useState } from 'react';
import ResourceManager from '../components/shared/ResourceManager';
import { useCrudResource } from '../hooks/useCrudResource';
import { vehiclesService } from '../services/vehiclesService';

const emptyForm = {
  vehicle_type: '',
  plate_number: '',
};

function getVehicleId(vehicle) {
  return vehicle.vehicle_id ?? vehicle.id;
}

export default function VehiclesPage() {
  const { items, loading, submitting, error, success, setSuccess, runAction } =
    useCrudResource(vehiclesService);
  const [formData, setFormData] = useState(emptyForm);
  const [editingItem, setEditingItem] = useState(null);

  const rows = useMemo(
    () =>
      items.map((vehicle) => ({
        ...vehicle,
        __uiId: getVehicleId(vehicle),
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
    const payload = {
      vehicle_type: formData.vehicle_type.trim(),
      plate_number: formData.plate_number.trim(),
    };

    if (!payload.vehicle_type || !payload.plate_number) {
      return;
    }

    const didSave = editingItem
      ? await runAction(
        () => vehiclesService.update(getVehicleId(editingItem), payload),
        'Vehicle updated successfully.',
      )
      : await runAction(
        () => vehiclesService.create(payload),
        'Vehicle created successfully.',
      );

    if (didSave) {
      resetForm();
    }

    return didSave;
  }

  function handleEdit(vehicle) {
    setSuccess('');
    setEditingItem(vehicle);
    setFormData({
      vehicle_type: vehicle.vehicle_type ?? '',
      plate_number: vehicle.plate_number ?? '',
    });
  }

  async function handleDelete(vehicle) {
    const didDelete = await runAction(
      () => vehiclesService.remove(getVehicleId(vehicle)),
      'Vehicle deleted successfully.',
    );

    if (
      didDelete &&
      editingItem &&
      getVehicleId(editingItem) === getVehicleId(vehicle)
    ) {
      resetForm();
    }
  }

  return (
    <ResourceManager
      title="Vehicle"
      helperText="Keep vehicle records isolated here so fleet updates stay easy to maintain."
      fields={[
        {
          name: 'vehicle_type',
          label: 'Vehicle type',
          placeholder: 'Bus, truck, van...',
          required: true,
        },
        {
          name: 'plate_number',
          label: 'Plate number',
          placeholder: 'Enter plate number',
          required: true,
        },
      ]}
      columns={[
        {
          key: 'vehicle_id',
          label: 'Identifier',
          render: (row) => row.vehicle_id ?? row.id ?? 'N/A',
        },
        { key: 'vehicle_type', label: 'Vehicle Type' },
        { key: 'plate_number', label: 'Plate Number' },
      ]}
      items={rows}
      loading={loading}
      submitting={submitting}
      error={error}
      success={success}
      formData={formData}
      editingItem={editingItem}
      emptyMessage="No vehicles found yet. Add a fleet record to get started."
      onChange={handleChange}
      onSubmit={handleSubmit}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCancelEdit={resetForm}
    />
  );
}
