import * as React from 'react';
import { AmityUiKitProvider, AmityUiKitChat } from '@amityco/react-native-cli-chat-ui-kit';

export default function App() {

  return (
    <AmityUiKitProvider
      apiKey="b0e9bb0f33daf967453ede4f565c45da830e8ae2b8643925" // Put your apiKey
      apiRegion="us" // Put your apiRegion
      userId="Shiv" // Put your UserId
      displayName="Shiv" // Put your displayName
      apiEndpoint="https://api.us.amity.co"
    >
      <AmityUiKitChat />
    </AmityUiKitProvider>
  );
}
