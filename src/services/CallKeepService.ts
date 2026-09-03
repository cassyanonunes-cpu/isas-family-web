// import RNCallKeep from 'react-native-callkeep';
import { Platform } from 'react-native';

class CallKeepService {
  setup() {
    console.log('[CallKeep] Setup desativado temporariamente para evitar crash');
  }

  displayIncomingCall(uuid: string, callerName: string, type: 'VOICE' | 'VIDEO' = 'VOICE') {
    console.log('[CallKeep] displayIncomingCall chamado (mock)');
  }

  endAllCalls() {
    console.log('[CallKeep] endAllCalls chamado (mock)');
  }

  onAnswerCallAction(callback: (data: { callUUID: string }) => void) {
    // mock
  }

  onEndCallAction(callback: (data: { callUUID: string }) => void) {
    // mock
  }
}

export default new CallKeepService();
