import { useEffect, useState } from 'react';
import { PencilLine, Plus, Sparkles, TableProperties, X } from 'lucide-react';

function renderValue(row, column) {
  if (typeof column.render === 'function') {
    return column.render(row);
  }

  const value = row[column.key];
  return value ?? 'N/A';
}

export default function ResourceManager({
  title,
  helperText,
  fields,
  columns,
  items,
  loading,
  submitting,
  error,
  success,
  formData,
  editingItem,
  emptyMessage,
  onChange,
  onSubmit,
  onEdit,
  onDelete,
  onCancelEdit,
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const modeLabel = editingItem ? `Editing ${title}` : `Creating ${title}`;

  useEffect(() => {
    if (editingItem) {
      setIsFormOpen(true);
    }
  }, [editingItem]);

  function handleOpenCreate() {
    onCancelEdit();
    setIsFormOpen(true);
  }

  function handleEditClick(row) {
    onEdit(row);
    setIsFormOpen(true);
  }

  function handleCloseForm() {
    setIsFormOpen(false);
    onCancelEdit();
  }

  async function handleFormSubmit(event) {
    const didSave = await onSubmit(event);

    if (didSave) {
      setIsFormOpen(false);
    }
  }

  return (
    <div className="resource-manager">
      <div className="page-grid resource-grid">
        <section className="panel panel-table dashboard-card">
          <div className="panel-header">
            <div>
              <h2>{title} List</h2>
              <p>Structured so each backend resource stays in its own manageable section.</p>
            </div>
            <div className="panel-header-actions">
              <div className="panel-chip neutral">
                <Sparkles size={16} />
                <span>Updated view</span>
              </div>
              <div className="panel-chip neutral">
                <TableProperties size={16} />
                <span>{items.length} items</span>
              </div>
              <button className="btn-primary resource-primary-btn" type="button" onClick={handleOpenCreate}>
                <Plus size={16} />
                <span>Add {title}</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading data from the backend...</div>
          ) : items.length === 0 ? (
            <div className="empty-state">{emptyMessage}</div>
          ) : (
            <div className="table-scroll resource-table-scroll">
              <table className="data-table resource-table">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => (
                    <tr key={row.__uiId}>
                      {columns.map((column) => (
                        <td key={column.key}>{renderValue(row, column)}</td>
                      ))}
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn-link"
                            type="button"
                            onClick={() => handleEditClick(row)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-link danger"
                            type="button"
                            onClick={() => onDelete(row)}
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
      </div>

      {isFormOpen && (
        <div className="resource-modal-backdrop" onClick={handleCloseForm}>
          <section
            className="panel panel-form dashboard-card resource-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-header">
              <div>
                <h2>{editingItem ? `Edit ${title}` : `Add ${title}`}</h2>
                <p>{helperText}</p>
              </div>
              <div className="resource-modal-actions">
                <div className="panel-chip">
                  {editingItem ? <PencilLine size={16} /> : <Plus size={16} />}
                  <span>{modeLabel}</span>
                </div>
                <button
                  className="resource-modal-close"
                  type="button"
                  aria-label="Close form"
                  onClick={handleCloseForm}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <form className="resource-form" onSubmit={handleFormSubmit}>
              <div className="resource-form-grid">
                {fields.map((field) => (
                  <label key={field.name} className="form-field">
                    <span className="form-label">{field.label}</span>

                    {field.type === 'select' ? (
                      <select
                        name={field.name}
                        value={formData[field.name]}
                        onChange={onChange}
                        required={field.required}
                      >
                        <option value="">{field.placeholder ?? `Select ${field.label}`}</option>
                        {(field.options ?? []).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type ?? 'text'}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={onChange}
                        required={field.required}
                        placeholder={field.placeholder}
                        min={field.min}
                        step={field.step}
                      />
                    )}
                  </label>
                ))}
              </div>

              {(error || success) && (
                <div className={`form-message ${error ? 'error' : 'success'}`}>
                  {error || success}
                </div>
              )}

              <div className="form-actions">
                <button className="btn-primary form-submit-btn" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingItem ? 'Update Record' : 'Create Record'}
                </button>
                <button
                  className="btn-secondary form-cancel-btn"
                  type="button"
                  onClick={handleCloseForm}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
