import { useEffect, useMemo, useState } from 'react';
import ResourceManager from '../components/shared/ResourceManager';
import { useCrudResource } from '../hooks/useCrudResource';
import { routesService } from '../services/routesService';
import { citiesService } from '../services/citiesService';

const emptyForm = {
  origin_id: '',
  dest_id: '',
  distance: '',
  estimated_time: '',
};

function getRouteId(route) {
  return route.route_id ?? route.id;
}

function getCityId(city) {
  return city.city_id ?? city.id;
}

export default function RoutesPage() {
  const { items, loading, submitting, error, success, setSuccess, runAction } =
    useCrudResource(routesService);
  const [formData, setFormData] = useState(emptyForm);
  const [editingItem, setEditingItem] = useState(null);
  const [cities, setCities] = useState([]);
  const [citiesError, setCitiesError] = useState('');

  useEffect(() => {
    async function loadCities() {
      try {
        const result = await citiesService.list();
        setCities(Array.isArray(result) ? result : []);
      } catch (loadError) {
        setCitiesError(loadError.message);
      }
    }

    loadCities();
  }, []);

  const cityMap = useMemo(
    () =>
      cities.reduce((map, city) => {
        map[String(getCityId(city))] = city.city_name;
        return map;
      }, {}),
    [cities],
  );

  const cityOptions = useMemo(
    () =>
      cities.map((city) => ({
        value: String(getCityId(city)),
        label: city.city_name,
      })),
    [cities],
  );

  const rows = useMemo(
    () =>
      items.map((route) => ({
        ...route,
        __uiId: getRouteId(route),
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
      origin_id: Number(formData.origin_id),
      dest_id: Number(formData.dest_id),
      distance: Number(formData.distance),
      estimated_time: formData.estimated_time.trim(),
    };

    if (
      !payload.origin_id ||
      !payload.dest_id ||
      !payload.distance ||
      !payload.estimated_time
    ) {
      return;
    }

    const didSave = editingItem
      ? await runAction(
        () => routesService.update(getRouteId(editingItem), payload),
        'Route updated successfully.',
      )
      : await runAction(
        () => routesService.create(payload),
        'Route created successfully.',
      );

    if (didSave) {
      resetForm();
    }

    return didSave;
  }

  function handleEdit(route) {
    setSuccess('');
    setEditingItem(route);
    setFormData({
      origin_id: String(route.origin_id ?? ''),
      dest_id: String(route.dest_id ?? ''),
      distance: String(route.distance ?? ''),
      estimated_time: route.estimated_time ?? '',
    });
  }

  async function handleDelete(route) {
    const didDelete = await runAction(
      () => routesService.remove(getRouteId(route)),
      'Route deleted successfully.',
    );

    if (didDelete && editingItem && getRouteId(editingItem) === getRouteId(route)) {
      resetForm();
    }
  }

  return (
    <ResourceManager
      title="Route"
      helperText="Routes depend on cities, so keep city data updated before adding a new route."
      fields={[
        {
          name: 'origin_id',
          label: 'Origin city',
          type: 'select',
          options: cityOptions,
          required: true,
        },
        {
          name: 'dest_id',
          label: 'Destination city',
          type: 'select',
          options: cityOptions,
          required: true,
        },
        {
          name: 'distance',
          label: 'Distance',
          type: 'number',
          placeholder: 'Enter distance',
          min: 0,
          step: 'any',
          required: true,
        },
        {
          name: 'estimated_time',
          label: 'Estimated time',
          placeholder: 'Example: 4h 30m',
          required: true,
        },
      ]}
      columns={[
        {
          key: 'route_id',
          label: 'Identifier',
          render: (row) => row.route_id ?? row.id ?? 'N/A',
        },
        {
          key: 'origin_id',
          label: 'Origin',
          render: (row) => cityMap[String(row.origin_id)] ?? row.origin_id,
        },
        {
          key: 'dest_id',
          label: 'Destination',
          render: (row) => cityMap[String(row.dest_id)] ?? row.dest_id,
        },
        { key: 'distance', label: 'Distance' },
        { key: 'estimated_time', label: 'Estimated Time' },
      ]}
      items={rows}
      loading={loading}
      submitting={submitting}
      error={error || citiesError}
      success={success}
      formData={formData}
      editingItem={editingItem}
      emptyMessage="No routes found yet. Add cities first, then create route links."
      onChange={handleChange}
      onSubmit={handleSubmit}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCancelEdit={resetForm}
    />
  );
}
