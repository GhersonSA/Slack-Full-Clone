import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import SlackReplicaScreen from './SlackReplicaScreen'

afterEach(() => {
  cleanup()
})

describe('SlackReplicaScreen', () => {
  it('renders primary workspace and channel structure', () => {
    render(<SlackReplicaScreen />)

    expect(screen.getAllByText('Fiktion GmbH').length).toBeGreaterThan(0)
    expect(screen.getByText('#soziale-medien')).toBeTruthy()
    expect(screen.getByText('Soziale Medien verfolgen und koordinieren')).toBeTruthy()
    expect(screen.getByText('Nachricht an #soziale-medien')).toBeTruthy()
  })

  it('renders key sidebar groups and active channel item', () => {
    render(<SlackReplicaScreen />)

    expect(screen.getAllByText('Favoriten').length).toBeGreaterThan(0)
    expect(screen.getByText('Channels')).toBeTruthy()
    expect(screen.getByText('Direktnachrichten')).toBeTruthy()

    const activeChannel = screen.getByText('soziale-medien').closest('button')
    expect(activeChannel).toBeTruthy()
    expect(activeChannel?.className).toContain('bg-[var(--slack-active)]')
  })

  it('renders notices and reaction chips in chat stream', () => {
    render(<SlackReplicaScreen />)

    expect(screen.getByText('Team-Meeting zur Bestandsaufnahme')).toBeTruthy()
    expect(screen.getByText('1/9 Meeting-Notizen')).toBeTruthy()
    expect(screen.getByText('🎉 1')).toBeTruthy()
    expect(screen.getByText('✨ 1')).toBeTruthy()
  })
})
