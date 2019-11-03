import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import * as Sensors from 'react-native-sensors';
import Ahrs from 'ahrs';
import KalmanFilter from 'kalmanjs';

const types = [
  'gyroscope',
  'accelerometer',
  'magnetometer',
]
  .map(
    type => Sensors.SensorTypes[type],
  );

const SensorFusionContext = React
  .createContext(
    null,
  );

const createFilters = () => types
  .map(
    () => [...Array(3)].map(
      () => new KalmanFilter(),
    ),
  );

const SensorFusionProvider = ({ children, ...extraProps }) => {
  const { sampleInterval } = extraProps;
  const [ ahrs, setAhrs ] = useState(
    new Ahrs(extraProps),
  );
  const [
    filters,
    setFilters,
  ] = useState(
    createFilters(),
  );
  const [ gyro ] = useState([ 0, 0, 0 ]);
  const [ accl ] = useState([ 0, 0, 0 ]);
  const [ comp ] = useState([ 0, 0, 0 ]);
  const get = [ gyro, accl, comp ];
  const [ value, setValue ] = useState(
    {
      ahrs,
      gyro,
      accl,
      comp,
    },
  );
  useEffect(
    () => {
      const ahrs = new Ahrs(extraProps);
      const filters = createFilters();
      setAhrs(ahrs);
      setValue({ ahrs, gyro, accl, comp });
      setFilters(
        filters,
      );
    },
    Object.keys(extraProps),
  );
  useEffect(
    () => types
      .map(
        type => Sensors.setUpdateIntervalForType(
          type,
          (1000 / sampleInterval),
        ),
      )
      .reduce(() => undefined),
    [ sampleInterval ],
  );
  useEffect(
    () => {
      const subscriptions = types
        .map(
          (type, i) => Sensors[type]
            .subscribe(
              ({ x, y, z }) => {
                [ x, y, z ]
                  .map(
                    (e, j) => get[i][j] = filters[i][j].filter(e),
                  );
                ahrs
                  .update(
                    ...get[0],
                    ...get[1],
                    ...get[2],
                  );
                if (i === types.length - 1) {
                  setValue(
                    {
                      ahrs,
                      gyro,
                      accl,
                      comp,
                    },
                  );
                }
              }
            ),
        );
      return () => subscriptions
        .map(({ unsubscribe }) => unsubscribe());
    },
    [],
  );
  return (
    <SensorFusionContext.Provider
      value={value}
      children={children}
    />
  );
};

SensorFusionProvider.propTypes = {
  sampleInterval: PropTypes.number,
  algorithm: PropTypes.string,
  beta: PropTypes.number,
  kp: PropTypes.number,
  ki: PropTypes.number,
  doInitialization: PropTypes.bool,
};

SensorFusionProvider.defaultProps = {
  sampleInterval: 60,
  algorithm: 'Madgwick',
  beta: 0.4,
  kp: 0.5,
  ki: 0,
  doInitialization: true,
};

export const toDegrees = a => (a + ((a < 0) ?  Math.PI * 2 : 0)) * (180 / Math.PI);

export const useSensorFusion = () => useContext(SensorFusionContext);

export const useCompass = () => {
  const { comp: [ x, y ] } = useSensorFusion();
  return toDegrees(
    Math.atan2(
      y,
      x,
    ),
  );
};

export default SensorFusionProvider;
