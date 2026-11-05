import { Button, Result } from 'antd'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router'
import { useTranslation } from '@/i18n'

export function RouteError() {
  const error = useRouteError()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <Result
        status={notFound ? '404' : 'warning'}
        title={notFound ? t('boardStates.routeNotFoundTitle') : t('boardStates.routeErrorTitle')}
        subTitle={
          notFound ? t('boardStates.routeNotFoundSubtitle') : t('boardStates.routeErrorSubtitle')
        }
        extra={
          <Button type="primary" onClick={() => void navigate('/', { replace: true })}>
            {t('common.backToBoard')}
          </Button>
        }
      />
    </main>
  )
}
