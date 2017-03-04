import React from 'react'
import {Modal, View, TouchableWithoutFeedback, Animated, PanResponder, Platform} from 'react-native'

import FlickAnimation from './libs/FlickAnimation'
import {visibleHeight} from './libs/layout'
import styles from './libs/styles'

class SlidingUpPanel extends React.Component {

  static propsTypes = {
    visible: React.PropTypes.bool.isRequired,
    onRequestClose: React.PropTypes.func.isRequired,
    height: React.PropTypes.number,
    initialPosition: React.PropTypes.number,
    disableDragging: React.PropTypes.bool,
    onShow: React.PropTypes.func,
    onDrag: React.PropTypes.func,
    onHide: React.PropTypes.func,
    showBackdrop: React.PropTypes.bool,
    contentStyle: React.PropTypes.any
  };

  static defaultProps = {
    disableDragging: false,
    height: visibleHeight,
    initialPosition: 0,
    onShow: () => {},
    onHide: () => {},
    onDrag: () => {},
    onRequestClose: () => {},
    showBackdrop: true
  };

  _panResponder: any;

  _animatedValueY = 0;
  _translateYAnimation = new Animated.Value(0);
  _flick = new FlickAnimation(this._translateYAnimation);

  constructor(props) {
    super(props)

    this._onDrag = this._onDrag.bind(this)
    this._onHide = this._onHide.bind(this)
    this._onShow = this._onShow.bind(this)
    this._renderBackdrop = this._renderBackdrop.bind(this)
  }

  componentWillMount() {
    this._translateYAnimation.addListener(this._onDrag)

    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: this._onStartShouldSetPanResponder.bind(this),
      onMoveShouldSetPanResponder: this._onMoveShouldSetPanResponder.bind(this),
      onPanResponderGrant: this._onPanResponderGrant.bind(this),
      onPanResponderMove: this._onPanResponderMove.bind(this),
      onPanResponderRelease: this._onPanResponderRelease.bind(this),
      onPanResponderTerminate: this._onPanResponderTerminate.bind(this)
    })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.visible && !this.props.visible) {
      this._onShow()
    }
  }

  componentWillUnmount() {
    this._translateYAnimation.removeListener(this._onDrag)
  }

  // eslint-disable-next-line no-unused-vars
  _onStartShouldSetPanResponder(evt, gestureState) {
    this._flick.stop()
    return !this.props.disableDragging
  }

  _onMoveShouldSetPanResponder(evt, gestureState) {
    this._flick.stop()

    if (this.props.disableDragging) {
      return false
    }

    if (this._animatedValueY <= -this.props.height) {
      return gestureState.dy > 1
    }

    return Math.abs(gestureState.dy) > 1
  }

  // eslint-disable-next-line no-unused-vars
  _onPanResponderGrant(evt, gestureState) {
    this._translateYAnimation.setOffset(this._animatedValueY)
    this._translateYAnimation.setValue(0)
  }

  _onPanResponderMove(evt, gestureState) {
    if (
      this._animatedValueY + gestureState.dy <= -this.props.height
    ) {
      return
    }

    this._translateYAnimation.setValue(gestureState.dy)
  }

  _onPanResponderRelease(evt, gestureState) {
    if (
      this._animatedValueY <= -this.props.height &&
      gestureState.dy <= 0
    ) {
      return
    }

    this._translateYAnimation.flattenOffset()

    const velocity = gestureState.vy

    if (Math.abs(gestureState.vy) > 0.1) {
      this._flick.start({velocity, fromValue: this._animatedValueY})
    }

    return
  }

  // eslint-disable-next-line no-unused-vars
  _onPanResponderTerminate(evt, gestureState) {
    //
  }

  _onDrag({value}) {
    this._animatedValueY = value
    this.props.onDrag(value)
    if (this._animatedValueY >= 0 && this.props.visible) {
      this.props.onRequestClose()
    }
  }

  _onShow() {
    const animationConfig = {
      duration: 260,
      toValue: -this.props.height,
      // eslint-disable-next-line no-undefined
      delay: Platform.OS === 'android' ? 166.67 : undefined // to make it looks smooth on android
    }

    Animated.timing(
      this._translateYAnimation,
      animationConfig
    ).start(() => {
      this.props.onShow()
    })
  }

  _onHide() {
    const animationConfig = {
      duration: 260,
      toValue: 0
    }

    Animated.timing(
      this._translateYAnimation,
      animationConfig
    ).start(() => {
      this._translateYAnimation.setValue(0)
      this.props.onHide()
    })
  }

  _renderBackdrop() {
    if (!this.props.showBackdrop) {
      return null
    }

    const backdropOpacity = this._translateYAnimation.interpolate({
      inputRange: [-visibleHeight, 0],
      outputRange: [0.75, 0],
      extrapolate: 'clamp'
    })

    return (
      <TouchableWithoutFeedback onPressIn={() => this._flick.stop()} onPress={this._onHide}>
        <Animated.View style={[styles.backdrop, {opacity: backdropOpacity}]} />
      </TouchableWithoutFeedback>
    )
  }

  render() {
    const translateY = this._translateYAnimation.interpolate({
      inputRange: [-this.props.height, 0],
      outputRange: [-this.props.height, 0],
      extrapolate: 'clamp'
    })

    const transform = {transform: [{translateY}]}

    const animatedContainerStyles = [
      styles.animatedContainer,
      {top: this.props.height},
      {height: this.props.height},
      transform
    ]

    return (
      <Modal
        transparent
        animationType='fade'
        onRequestClose={this._onHide}
        visible={this.props.visible}>
        <View style={styles.container}>
          {this._renderBackdrop()}
          <Animated.View
            {...this._panResponder.panHandlers}
            style={animatedContainerStyles}>
            <View style={this.props.contentStyle}>
              {this.props.children}
            </View>
          </Animated.View>
        </View>
      </Modal>
    )
  }
}

export default SlidingUpPanel
