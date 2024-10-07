import { useState } from 'react'
import jwtDecode from 'jwt-decode'
import { View } from '@instructure/ui-view';
// @ts-expect-error Could not find a declaration file for module '@oxctl/ui-lti'
import {LtiTokenRetriever, LtiApplyTheme} from '@oxctl/ui-lti'

import './App.css'
// MessageDisplay from './MessageDisplay';
import Chat from './Chat';

function App() {

  //const [jwt, setJwt] = useState(null)
  const [rawJwt, setRawJwt] = useState(String || null)
  const [comInstructureBrandConfigJsonUrl, setComInstructureBrandConfigJsonUrl] = useState(null)
  const [canvasUserPrefersHighContrast, setCanvasUserPrefersHighContrast] = useState(Boolean || null)

  const updateToken = (receivedToken: string) => {
    setRawJwt(receivedToken);
    const jwt = jwtDecode(receivedToken)
    //setJwt(jwt);
    // @ts-expect-error 'jwt' is of type 'unknown'
    setComInstructureBrandConfigJsonUrl(jwt['https://purl.imsglobal.org/spec/lti/claim/custom'].com_instructure_brand_config_json_url)
    // @ts-expect-error 'jwt' is of type 'unknown'
    setCanvasUserPrefersHighContrast(jwt['https://purl.imsglobal.org/spec/lti/claim/custom'].canvas_user_prefers_high_contrast === 'true')
  }

  return (
    <LtiTokenRetriever handleJwt={updateToken}>
      <LtiApplyTheme url={comInstructureBrandConfigJsonUrl} highContrast={canvasUserPrefersHighContrast}>
        <View as='div' padding='0'>
          <Chat token={rawJwt}/>
        </View>
      </LtiApplyTheme>
    </LtiTokenRetriever>
  );
}

export default App
