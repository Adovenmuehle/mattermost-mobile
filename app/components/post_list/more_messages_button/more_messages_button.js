// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import {Animated, View} from 'react-native';
import PropTypes from 'prop-types';

import TouchableWithFeedback from '@components/touchable_with_feedback';
import VectorIcon from '@components/vector_icon';
import FormattedText from '@components/formatted_text';
import {makeStyleSheetFromTheme} from '@utils/theme';

export const HIDDEN_TOP = -100;
export const SHOWN_TOP = 10;

export default class MoreMessageButton extends React.PureComponent {
    static propTypes = {
        theme: PropTypes.object.isRequired,
        postIds: PropTypes.array.isRequired,
        channelId: PropTypes.string.isRequired,
        unreadCount: PropTypes.number.isRequired,
        initialIndex: PropTypes.number.isRequired,
        scrollToIndex: PropTypes.func.isRequired,
        registerViewableItemsListener: PropTypes.func.isRequired,
        deepLinkURL: PropTypes.string,
    };

    state = {moreCount: 0};
    top = new Animated.Value(HIDDEN_TOP);

    componentDidMount() {
        this.removeListener = this.props.registerViewableItemsListener(this.onViewableItemsChanged);
        this.reset();
    }

    componentWillUnmount() {
        if (this.removeListener) {
            this.removeListener();
        }
        if (this.viewableItemsChangedTimer) {
            clearTimeout(this.viewableItemsChangedTimer);
        }
    }

    componentDidUpdate(prevProps) {
        if (this.props.channelId !== prevProps.channelId) {
            this.reset();
        }
    }

    reset = () => {
        if (this.viewableItemsChangedTimer) {
            clearTimeout(this.viewableItemsChangedTimer);
        }
        this.hide();
        this.prevInitialIndex = 0;
        this.disableViewableItemsHandler = false;
    }

    show = () => {
        if (!this.visible && this.state.moreCount > 0 && !this.props.deepLinkURL) {
            this.visible = true;
            Animated.spring(this.top, {
                toValue: SHOWN_TOP,
                useNativeDriver: false,
            }).start();
        }
    }

    hide = () => {
        if (this.visible) {
            this.visible = false;
            Animated.spring(this.top, {
                toValue: HIDDEN_TOP,
                useNativeDriver: false,
            }).start();
        }
    }

    cancel = () => {
        this.hide();
        this.disableViewableItemsHandler = true;
    }

    onMoreMessagesPress = () => {
        const {initialIndex, scrollToIndex} = this.props;
        if (initialIndex === this.prevInitialIndex) {
            // Prevent multiple taps on the more messages button from calling
            // scrollToIndex if the initialIndex has not yet changed.
            return;
        }

        this.prevInitialIndex = initialIndex;
        scrollToIndex(initialIndex);
    }

    onViewableItemsChanged = (viewableItems) => {
        const {initialIndex, unreadCount, scrollToIndex} = this.props;
        if (initialIndex <= 0 || viewableItems.length === 0) {
            return;
        }

        if (this.viewableItemsChangedTimer) {
            clearTimeout(this.viewableItemsChangedTimer);
        }

        if (!this.disableViewableItemsHandler) {
            const viewableIndeces = viewableItems.map((item) => item.index);

            // Hide More Messages button when New Messages line is viewable
            if (initialIndex >= unreadCount && viewableIndeces[viewableIndeces.length - 1] >= initialIndex) {
                this.hide();
                this.disableViewableItemsHandler = true;

                // If the first post is viewable as well, this means that the channel
                // was just loaded. In this case let's auto scroll to the New Messages line
                // in case it's partially hidden behind the top bar.
                if (viewableIndeces[0] === 0) {
                    scrollToIndex(initialIndex);
                }

                return;
            }

            const delay = this.viewableItemsChangedTimer ? 100 : 0;
            this.viewableItemsChangedTimer = setTimeout(() => {
                this.viewableItemsChangedHandler(viewableIndeces);
            }, delay);
        }
    }

    viewableItemsChangedHandler = (viewableIndeces) => {
        const {initialIndex, unreadCount} = this.props;
        if (!viewableIndeces.includes(initialIndex)) {
            const readCount = viewableIndeces.pop() || 0;
            const moreCount = unreadCount - readCount;

            if (moreCount > 0) {
                this.setState({moreCount}, this.show);
            }
        }
    }

    intlMoreMessage = (firstPage, singular, countText) => {
        if (firstPage) {
            if (singular) {
                return {
                    id: 'mobile.more_messages.firstPageSingular',
                    defaultMessage: '{countText} new message',
                    values: {countText},
                };
            }

            return {
                id: 'mobile.more_messages.firstPagePlural',
                defaultMessage: '{countText} new messages',
                values: {countText},
            };
        }

        if (singular) {
            return {
                id: 'mobile.more_messages.nextPageSingular',
                defaultMessage: '{countText} more new message',
                values: {countText},
            };
        }

        return {
            id: 'mobile.more_messages.nextPagePlural',
            defaultMessage: '{countText} more new messages',
            values: {countText},
        };
    };

    moreMessage = () => {
        const {moreCount} = this.state;

        let countText = Math.min(60, moreCount);
        if (moreCount > 60) {
            countText += '+';
        }

        const firstPage = this.prevInitialIndex === 0;
        const singular = moreCount === 1;

        return this.intlMoreMessage(firstPage, singular, countText);
    }

    render() {
        const styles = getStyleSheet(this.props.theme);
        const moreMessage = this.moreMessage();

        return (
            <Animated.View style={[styles.animatedContainer, {top: this.top}]}>
                <View style={styles.container}>
                    <TouchableWithFeedback
                        type={'none'}
                        onPress={this.onMoreMessagesPress}
                    >
                        <View style={styles.moreContainer}>
                            <VectorIcon
                                name='md-arrow-up'
                                type='ion'
                                style={styles.icon}
                            />
                            <FormattedText
                                id={moreMessage.id}
                                defaultMessage={moreMessage.defaultMessage}
                                values={moreMessage.values}
                                style={styles.text}
                            />
                        </View>
                    </TouchableWithFeedback>
                    <TouchableWithFeedback
                        type={'none'}
                        onPress={this.cancel}
                    >
                        <View style={styles.cancelContainer}>
                            <VectorIcon
                                name='md-close'
                                type='ion'
                                style={styles.icon}
                            />
                        </View>
                    </TouchableWithFeedback>
                </View>
            </Animated.View>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        animatedContainer: {
            flex: 1,
            position: 'absolute',
            zIndex: 1,
            elevation: 1,
            marginRight: 10,
            marginLeft: 10,
        },
        container: {
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'space-evenly',
            alignItems: 'center',
            backgroundColor: theme.buttonBg,
            padding: 8,
            borderRadius: 4,
            width: '100%',
            height: 40,
        },
        moreContainer: {
            flex: 11,
            flexDirection: 'row',
        },
        cancelContainer: {
            flex: 1,
            alignItems: 'flex-end',
        },
        text: {
            fontWeight: 'bold',
            color: theme.buttonColor,
            paddingHorizontal: 5,
        },
        icon: {
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.buttonColor,
            paddingHorizontal: 5,
        },
    };
});
