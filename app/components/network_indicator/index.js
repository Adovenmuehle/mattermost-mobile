// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {stopPeriodicStatusUpdates, startPeriodicStatusUpdates} from '@mm-redux/actions/users';
import {init as initWebSocket, close as closeWebSocket} from '@actions/websocket';
import {getCurrentChannelId, isManuallyUnread} from '@mm-redux/selectors/entities/channels';

import {connection} from 'app/actions/device';
import {markChannelViewedAndRead, setChannelRetryFailed} from '@actions/channels';
import {setCurrentUserStatusOffline, logout} from 'app/actions/views/user';
import {getConnection, isLandscape} from 'app/selectors/device';

import NetworkIndicator from './network_indicator';

function mapStateToProps(state) {
    const {websocket} = state.requests.general;
    const websocketStatus = websocket.status;

    return {
        currentChannelId: getCurrentChannelId(state),
        isManuallyUnread: isManuallyUnread(state, currentChannelId),
        isLandscape: isLandscape(state),
        isOnline: getConnection(state),
        websocketErrorCount: websocket.error,
        websocketStatus,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        actions: bindActionCreators({
            closeWebSocket,
            connection,
            initWebSocket,
            logout,
            markChannelViewedAndRead,
            setChannelRetryFailed,
            setCurrentUserStatusOffline,
            startPeriodicStatusUpdates,
            stopPeriodicStatusUpdates,
        }, dispatch),
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(NetworkIndicator);
