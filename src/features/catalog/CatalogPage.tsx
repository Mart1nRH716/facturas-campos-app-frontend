import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Plus, Search, Trash2, X } from "lucide-react";
import { request, type Entity, type Provider } from "../../lib/api";

type Kind = "entidades" | "proveedores";
type Item = Entity | Provider;

const config = {
  entidades: {
    singular: "entidad",
    plural: "entidades",
    title: "Entidades",
    maxName: 100,
    maxCode: 20,
  },
  proveedores: {
    singular: "proveedor",
    plural: "proveedores",
    title: "Proveedores",
    maxName: 200,
    maxCode: 10,
  },
};

export function CatalogPage({ kind }: { kind: Kind }) {
  const metadata = config[kind];
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Item | null | undefined>(undefined);
  const [feedback, setFeedback] = useState("");
  const endpoint = `/${kind}/`;
  const query = useQuery({
    queryKey: [kind, search],
    queryFn: () =>
      request<Item[]>(
        `${endpoint}${search ? `?nombre=${encodeURIComponent(search)}` : ""}`,
      ),
  });

  async function remove(item: Item) {
    if (!window.confirm(`¿Eliminar ${item.nombre}?`)) return;
    try {
      await request<void>(
        `${endpoint}${"id_entidad" in item ? item.id_entidad : item.id_proveedor}`,
        { method: "DELETE" },
      );
      await queryClient.invalidateQueries({ queryKey: [kind] });
      setFeedback(
        `${metadata.singular[0].toUpperCase()}${metadata.singular.slice(1)} eliminado correctamente.`,
      );
    } catch (error) {
      setFeedback(
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el registro.",
      );
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">CATÁLOGOS</span>
          <h1>{metadata.title}</h1>
          <p className="muted">Nombres exactos usados por tus archivos XML.</p>
        </div>
        <button className="button primary" onClick={() => setEditing(null)}>
          <Plus size={17} /> Nueva {metadata.singular}
        </button>
      </header>
      {feedback && (
        <div className="alert info">
          {feedback}
          <button onClick={() => setFeedback("")} aria-label="Cerrar mensaje">
            <X size={16} />
          </button>
        </div>
      )}
      <section className="table-panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Buscar ${metadata.plural}...`}
            />
          </div>
          <span className="result-count">
            {query.data?.length ?? 0} registros
          </span>
        </div>
        {query.isLoading && (
          <div className="table-message">Cargando catálogo...</div>
        )}
        {query.isError && (
          <div className="table-message error-text">
            {query.error instanceof Error
              ? query.error.message
              : "No se pudo cargar el catálogo."}
          </div>
        )}
        {!query.isLoading && !query.isError && !query.data?.length && (
          <div className="table-message">
            <strong>No hay {metadata.plural} todavía</strong>
            <span>
              Agrega el primero para comenzar a procesar tus facturas.
            </span>
          </div>
        )}
        {!!query.data?.length && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th className="actions-head">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {query.data.map((item) => (
                  <tr
                    key={
                      "id_entidad" in item ? item.id_entidad : item.id_proveedor
                    }
                  >
                    <td>
                      <strong>{item.nombre}</strong>
                    </td>
                    <td>
                      <span className="code-pill">{item.codigo}</span>
                    </td>
                    <td className="actions">
                      <button title="Editar" onClick={() => setEditing(item)}>
                        <Edit3 size={16} />
                      </button>
                      <button title="Eliminar" onClick={() => remove(item)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editing !== undefined && (
        <CatalogForm
          kind={kind}
          item={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            queryClient.invalidateQueries({ queryKey: [kind] });
            setFeedback(
              `${metadata.singular[0].toUpperCase()}${metadata.singular.slice(1)} guardado correctamente.`,
            );
          }}
        />
      )}
    </div>
  );
}

function CatalogForm({
  kind,
  item,
  onClose,
  onSaved,
}: {
  kind: Kind;
  item: Item | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const metadata = config[kind];
  const endpoint = `/${kind}/`;
  const [name, setName] = useState(item?.nombre ?? "");
  const [code, setCode] = useState(item?.codigo ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = JSON.stringify({ nombre: name.trim(), codigo: code.trim() });
      const id = item
        ? "id_entidad" in item
          ? item.id_entidad
          : item.id_proveedor
        : "";
      await request(`${endpoint}${id}`, {
        method: item ? "PATCH" : "POST",
        body,
      });
      onSaved();
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "No fue posible guardar.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <section className="modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={19} />
        </button>
        <span className="eyebrow">{item ? "EDITAR" : "NUEVO REGISTRO"}</span>
        <h2>
          {item ? `Editar ${metadata.singular}` : `Nueva ${metadata.singular}`}
        </h2>
        <p className="muted">Mantén los datos tal como aparecen en tus XML.</p>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit} className="form-stack">
          <label>
            Nombre
            <input
              required
              maxLength={metadata.maxName}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </label>
          <label>
            Código
            <input
              required
              maxLength={metadata.maxCode}
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="button primary" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
