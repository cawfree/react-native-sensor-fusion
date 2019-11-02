import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import * as Sensors from 'react-native-sensors';
import Ahrs from 'ahrs';
import KalmanFilter from 'kalmanjs';

const types = ['gyroscope', 'accelerometer', 'magnetometer']
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
    },
  );
  useEffect(
    () => {
      const ahrs = new Ahrs(extraProps);
      const filters = createFilters();
      setAhrs(ahrs);
      setValue({ ahrs });
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
                get[i][0] = filters[i][0].filter(x);
                get[i][1] = filters[i][1].filter(y);
                get[i][2] = filters[i][2].filter(z);
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
  algorithm: 'Mahony',
  beta: 0.4,
  kp: 0.5,
  ki: 0,
  doInitialization: false,
};

export const useSensorFusion = () => useContext(SensorFusionContext);

export default SensorFusionProvider;
