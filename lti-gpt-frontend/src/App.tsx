import { useState } from 'react'
//import reactLogo from './assets/react.svg'
//import viteLogo from '/vite.svg'
import jwtDecode from 'jwt-decode'
import { View } from '@instructure/ui-view';
import {LtiHeightLimit, LtiTokenRetriever, LtiApplyTheme} from '@oxctl/ui-lti'

import './App.css'
// MessageDisplay from './MessageDisplay';
import Chat from './Chat';

function App() {

  const [jwt, setJwt] = useState(null)
  const [rawJwt, setRawJwt] = useState(null)
  const [comInstructureBrandConfigJsonUrl, setComInstructureBrandConfigJsonUrl] = useState(null)
  const [canvasUserPrefersHighContrast, setCanvasUserPrefersHighContrast] = useState(null)

  const updateToken = (receivedToken: string) => {
    setRawJwt(receivedToken);
    const jwt = jwtDecode(receivedToken)
    setJwt(jwt);
    setComInstructureBrandConfigJsonUrl(jwt['https://purl.imsglobal.org/spec/lti/claim/custom'].com_instructure_brand_config_json_url)
    setCanvasUserPrefersHighContrast(jwt['https://purl.imsglobal.org/spec/lti/claim/custom'].canvas_user_prefers_high_contrast === 'true')
  }

  return (
    <LtiTokenRetriever handleJwt={updateToken}>
      <LtiApplyTheme url={comInstructureBrandConfigJsonUrl} highContrast={canvasUserPrefersHighContrast}>
        <View as='div' padding='small'>
          <Chat token={rawJwt}/>
        </View>
      </LtiApplyTheme>
    </LtiTokenRetriever>
  );
}

export default App
