import AppLayout from './AppLayout'
import { slackLayoutMockData } from './mockSlackLayoutData'

function SlackReplicaScreen(): React.JSX.Element {
  return <AppLayout {...slackLayoutMockData} />
}

export default SlackReplicaScreen
