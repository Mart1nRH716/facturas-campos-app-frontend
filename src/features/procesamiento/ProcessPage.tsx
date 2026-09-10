import { useRef, useState, type FormEvent } from "react";
import {
  Download,
  FileArchive,
  FileCheck2,
  FileUp,
  AlertCircle,
} from "lucide-react";
import { type BatchMetadata } from "../../lib/api";
import { env } from "../../config/env";

export function ProcessPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [outputName, setOutputName] = useState("factura_layout");
  const [metadata, setMetadata] = useState<BatchMetadata | null>(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  function selectFile(selected: File | undefined) {
    setError("");
    setMetadata(null);
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".zip")) {
      setFile(null);
      setError("El archivo debe tener extensión .zip.");
      return;
    }
    setFile(selected);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Selecciona un archivo ZIP para continuar.");
      return;
    }
    setProcessing(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("nombre_archivo_xlsx", outputName.trim() || "factura_layout");
      const token = sessionStorage.getItem("facturas_token");
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};
      const response = await fetch(env.apiUrl + "/xmls/procesar-zip", {
        method: "POST",
        body: form,
        headers,
      });
      if (!response.ok) {
        if (response.status === 401)
          window.dispatchEvent(new Event("auth-expired"));
        const body = await response.json().catch(() => ({}));
        throw new Error(
          body.detail ?? `No se pudo procesar el ZIP (${response.status}).`,
        );
      }
      const blob = await response.blob();
      const header = response.headers.get("X-Metadata");
      const parsed = header ? (JSON.parse(header) as BatchMetadata) : null;
      setMetadata(parsed);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${outputName.trim() || "factura_layout"}.xlsx`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "No fue posible procesar el lote.",
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">PROCESAMIENTO</span>
          <h1>Procesar ZIP</h1>
          <p className="muted">Convierte tus XML CFDI en un reporte XLSX.</p>
        </div>
      </header>
      <div className="process-layout">
        <form className="process-panel" onSubmit={submit}>
          <div
            className="drop-zone"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              selectFile(event.dataTransfer.files[0]);
            }}
          >
            <input
              ref={inputRef}
              hidden
              type="file"
              accept=".zip,application/zip"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
            <span className="upload-icon">
              <FileArchive size={25} />
            </span>
            <strong>{file ? file.name : "Arrastra tu archivo ZIP aquí"}</strong>
            <span>
              {file
                ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
                : "o haz clic para seleccionarlo"}
            </span>
          </div>
          <label>
            Nombre del archivo de salida
            <input
              value={outputName}
              onChange={(event) =>
                setOutputName(event.target.value.replace(/\.xlsx$/i, ""))
              }
              placeholder="factura_layout"
            />
            <small>Se descargará como .xlsx</small>
          </label>
          {error && (
            <div className="alert error">
              <AlertCircle size={17} />
              {error}
            </div>
          )}
          <button
            className="button primary full"
            disabled={processing}
            type="submit"
          >
            {processing ? (
              "Procesando lote..."
            ) : (
              <>
                <FileUp size={17} /> Procesar y descargar
              </>
            )}
          </button>
        </form>
        <aside className="process-aside">
          <div className="aside-icon">
            <FileCheck2 size={21} />
          </div>
          <h3>Resultado del lote</h3>
          {metadata ? (
            <div className="batch-result">
              <div>
                <strong>{metadata.xmls_procesados}</strong>
                <span>procesados</span>
              </div>
              <div>
                <strong>{metadata.xmls_encontrados}</strong>
                <span>encontrados</span>
              </div>
              <div className={metadata.errores ? "has-errors" : ""}>
                <strong>{metadata.errores}</strong>
                <span>con errores</span>
              </div>
              {metadata.lista_errores_xml.length > 0 && (
                <div className="failed-files">
                  <small>Archivos con error</small>
                  {metadata.lista_errores_xml.map((name) => (
                    <span key={name}>{name}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="muted">
              Cuando el procesamiento termine, aquí verás el resumen de XML
              encontrados y procesados.
            </p>
          )}
          <div className="download-note">
            <Download size={16} /> La descarga comenzará automáticamente.
          </div>
        </aside>
      </div>
    </div>
  );
}
