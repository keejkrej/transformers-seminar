import {
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
} from '@tanstack/react-router'
import { Suspense } from 'react'
import { MODULE_PAGES } from './modules/index'
import { TalkPage } from './pages/TalkPage'

const rootRoute = createRootRoute({
  component: () => <Outlet />,
})

const talkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: TalkPage,
})

function ModulePage() {
  const { slug } = moduleRoute.useParams()
  const Page = MODULE_PAGES[slug]
  if (!Page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6">
        <p className="font-display text-2xl font-semibold">No such module.</p>
        <Link to="/" className="text-clay font-display font-semibold">
          ← Back to the talk
        </Link>
      </div>
    )
  }
  return (
    <Suspense
      fallback={
        <div className="bg-ink text-stone font-display flex min-h-screen items-center justify-center text-sm tracking-[0.2em] uppercase">
          Loading module…
        </div>
      }
    >
      <Page />
    </Suspense>
  )
}

const moduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/m/$slug',
  component: ModulePage,
})

const routeTree = rootRoute.addChildren([talkRoute, moduleRoute])

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
