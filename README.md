# react-native-sensor-fusion
Robust absolute 3D positioning in React Native, using [sensor fusion](https://en.wikipedia.org/wiki/Sensor_fusion) to exploit the superior characterstics of the device Accelerometer, Gyroscope and Magnetometer, whilst mitigating against their negative qualities.

Physical data acquisition is implemented using [react-native-sensors](https://github.com/react-native-sensors/). The noise in sampled data is filtered from the input signals using the high quality [kalmanjs](https://github.com/wouterbulten/kalmanjs), and sensor fusion is calculated using [ahrs](https://github.com/psiphi75/ahrs).

## 🚀 Getting Started

Using [`npm`]():

```sh
npm install --save react-native-sensor-fusion
```

Using [`yarn`]():

```sh
yarn add react-native-sensor-fusion
```

## ✍️ Example

```javascript
import React from 'react';
import { Text } from 'react-native';
import SensorFusionProvider, { useSensorFusion, useCompass, toDegrees } from 'react-native-sensor-fusion';

const Indicator = () => {
  const { ahrs } = useSensorFusion();  
  const { x, y, z, w } = ahrs.toVector();
  return (
    <Text
      children={toDegrees(z)}
    />
  );

const Indicator = () => {
  const { ahrs } = useSensorFusion();
  const { heading, pitch, roll } = ahrs.getEulerAngles();
  const compass = useCompass();
  return (
    <Text>
      Heading: {toDegrees(heading)}°{'\n'}
      Pitch: {toDegrees(pitch)}°{'\n'}
      Roll: {toDegrees(roll)}°{'\n'}
      Compass: {toDegrees(compass)}°{'\n'}
    </Text>
  );
};

export default () => (
  <SensorFusionProvider>
    <Indicator />
  </SensorFusionProvider>
);
```

## 📌 Prop Types

-----
Prop                  | Type     | Default                   | Required | Description
--------------------- | -------- | ------------------------- | -------- | -----------
sampleInterval|number|60|No|The frequency to sample the device sensors in Hz.
algorithm|string|'Mahony'|No|Choose from the `Madgwick` or `Mahony` filter.
beta|number|0.4|No|The filter noise value, smaller values have smoother estimates, but have higher latency. This only works for the `Madgwick` filter.
kp|number|0.5|No|The filter noise values for the `Mahony` filter (Proportional).
ki|number|0|No|The filter noise values for the `Mahony` filter (Integral).

## ✌️ License
[MIT](https://opensource.org/licenses/MIT)
