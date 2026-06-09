import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import AppLayout from './AppLayout'
import { slackLayoutMockData } from './mockSlackLayoutData'

afterEach(() => {
  cleanup()
})

describe('AppLayout responsive and density variants', () => {
  it('renders compact mode with expected top bar height class', () => {
    const { container } = render(<AppLayout {...slackLayoutMockData} density="compact" />)

    const topBar = container.querySelector('header.h-10')
    expect(topBar).toBeTruthy()
  })

  it('renders collapsed sidebar and preserves item accessibility labels', () => {
    render(<AppLayout {...slackLayoutMockData} sidebarCollapsed />)

    const channelButton = screen.getAllByLabelText('soziale-medien')[0]
    const sidebar = channelButton.closest('aside')

    expect(sidebar).toBeTruthy()
    expect(sidebar?.className).toContain('w-[74px]')
  })

  it('keeps workspace rail visible when narrow-hide option is disabled', () => {
    const { container } = render(
      <AppLayout {...slackLayoutMockData} hideWorkspaceRailOnNarrow={false} />
    )

    const workspaceRail = container.querySelector('aside.block')
    expect(workspaceRail).toBeTruthy()
  })
})
