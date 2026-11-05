import { InboxOutlined } from '@ant-design/icons'
import { Alert, App, Button, Modal, Radio, Statistic, Upload } from 'antd'
import { useMemo, useState } from 'react'
import { extractRecords, previewImport, type ImportMode } from '@/domain/importExport'
import type { Task } from '@/domain/task'
import { t, useTranslation } from '@/i18n'
import { cn } from '@/lib/cn'
import { useImportTasksMutation } from '@/store/api'

interface ImportDialogProps {
  open: boolean
  existing: readonly Task[]
  onClose: () => void
}

interface Loaded {
  fileName: string
  records: unknown[]
}

async function readFile(file: File): Promise<Loaded | string> {
  let raw: unknown
  try {
    raw = JSON.parse(await file.text())
  } catch {
    return t('importDialog.invalidJsonError', { fileName: file.name })
  }
  const records = extractRecords(raw)
  if (!records) return t('importDialog.missingTasksError')
  return { fileName: file.name, records }
}

function Preview({
  loaded,
  existing,
  mode,
  onModeChange,
}: {
  loaded: Loaded
  existing: readonly Task[]
  mode: ImportMode
  onModeChange: (mode: ImportMode) => void
}) {
  const { t } = useTranslation()
  const preview = useMemo(
    () => previewImport(loaded.records, existing, mode),
    [loaded.records, existing, mode],
  )
  const added = preview.valid.length - preview.updates
  const modes: { value: ImportMode; title: string; detail: string }[] = [
    {
      value: 'merge',
      title: t('importDialog.modeMergeTitle'),
      detail: t('importDialog.modeMergeDetail'),
    },
    {
      value: 'replace',
      title: t('importDialog.modeReplaceTitle'),
      detail: t('importDialog.modeReplaceDetail'),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <Radio.Group
        value={mode}
        onChange={(e) => onModeChange(e.target.value as ImportMode)}
        aria-label={t('importDialog.modeAria')}
        className="grid gap-2 sm:grid-cols-2"
      >
        {modes.map((m) => (
          <Radio
            key={m.value}
            value={m.value}
            className={cn(
              'm-0 rounded-control border p-3 transition-colors',
              mode === m.value
                ? 'border-accent bg-accent-soft'
                : 'border-line hover:border-line-strong',
            )}
          >
            <span className="block text-[13px] font-medium text-ink">{m.title}</span>
            <span className="mt-0.5 block text-[12px] text-ink-2">{m.detail}</span>
          </Radio>
        ))}
      </Radio.Group>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-control border border-line p-3">
          <Statistic title={t('importDialog.statValid')} value={preview.valid.length} />
        </div>
        <div className="rounded-control border border-line p-3">
          <Statistic
            title={mode === 'merge' ? t('importDialog.statMerge') : t('importDialog.statReplace')}
            value={mode === 'merge' ? `${added} / ${preview.updates}` : existing.length}
          />
        </div>
        <div
          className={cn(
            'rounded-control border p-3',
            preview.issues.length ? 'border-danger/40 bg-danger-soft' : 'border-line',
          )}
        >
          <Statistic
            title={t('importDialog.statInvalid')}
            value={preview.issues.length}
            styles={{ content: preview.issues.length ? { color: 'var(--danger)' } : undefined }}
          />
        </div>
      </div>

      {preview.issues.length > 0 && (
        <section aria-label={t('importDialog.issuesAria')}>
          <h3 className="text-[12px] font-medium text-ink-2">{t('importDialog.issuesHeading')}</h3>
          <ol className="mt-2 flex max-h-60 flex-col divide-y divide-line overflow-y-auto rounded-control border border-line">
            {preview.issues.map((issue) => (
              <li key={issue.index} className="px-3 py-2 text-[12px]">
                <p className="text-ink">
                  <span className="font-mono text-ink-3">#{issue.index + 1}</span>{' '}
                  {issue.title ?? (
                    <span className="text-ink-3">{t('importDialog.untitledRecord')}</span>
                  )}
                </p>
                <ul className="mt-0.5 list-disc pl-5 text-danger">
                  {issue.messages.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      )}

      <PreviewFooterHint valid={preview.valid.length} />
    </div>
  )
}

function PreviewFooterHint({ valid }: { valid: number }) {
  const { t } = useTranslation()
  if (valid > 0) return null
  return <Alert type="error" showIcon title={t('importDialog.noValidRecords')} />
}

export function ImportDialog({ open, existing, onClose }: ImportDialogProps) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [mode, setMode] = useState<ImportMode>('merge')
  const [importTasks, { isLoading }] = useImportTasksMutation()
  const { message } = App.useApp()
  const { t } = useTranslation()

  const validCount = useMemo(
    () => (loaded ? previewImport(loaded.records, existing, mode).valid.length : 0),
    [loaded, existing, mode],
  )

  const reset = () => {
    setLoaded(null)
    setFileError(null)
    setMode('merge')
  }

  const close = () => {
    onClose()
    reset()
  }

  const confirm = async () => {
    if (!loaded) return
    const result = await importTasks({ records: loaded.records, mode })
    if ('error' in result) {
      void message.error(result.error?.message ?? t('common.actionFailedRetry'))
      return
    }
    void message.success(
      t('importDialog.importedToast', {
        imported: result.data.imported,
        total: result.data.total,
      }),
    )
    close()
  }

  return (
    <Modal
      open={open}
      onCancel={close}
      width={560}
      destroyOnHidden
      closable={{ 'aria-label': t('common.close') }}
      title={
        <div>
          <div>{t('importDialog.title')}</div>
          {loaded && (
            <div className="mt-0.5 truncate font-mono text-[12px] font-normal text-ink-3">
              {t('importDialog.fileSummary', {
                fileName: loaded.fileName,
                count: loaded.records.length,
              })}
            </div>
          )}
        </div>
      }
      footer={
        <div className="flex items-center gap-2">
          {loaded && (
            <Button type="link" className="mr-auto px-0" onClick={reset}>
              {t('importDialog.chooseAnotherFile')}
            </Button>
          )}
          <Button onClick={close}>{t('common.cancel')}</Button>
          <Button
            type="primary"
            danger={mode === 'replace'}
            disabled={!loaded || validCount === 0}
            loading={isLoading}
            onClick={() => void confirm()}
          >
            {mode === 'replace'
              ? t('importDialog.replaceBtn', { count: validCount })
              : t('importDialog.importBtn', { count: validCount })}
          </Button>
        </div>
      }
    >
      {loaded ? (
        <Preview loaded={loaded} existing={existing} mode={mode} onModeChange={setMode} />
      ) : (
        <div className="flex flex-col gap-3">
          <Upload.Dragger
            accept="application/json,.json"
            multiple={false}
            showUploadList={false}
            beforeUpload={(file) => {
              void readFile(file).then((res) => {
                if (typeof res === 'string') setFileError(res)
                else {
                  setFileError(null)
                  setLoaded(res)
                }
              })
              return false
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">{t('importDialog.draggerTitle')}</p>
            <p className="ant-upload-hint">{t('importDialog.draggerHint')}</p>
          </Upload.Dragger>
          {fileError && <Alert type="error" showIcon title={fileError} />}
        </div>
      )}
    </Modal>
  )
}
