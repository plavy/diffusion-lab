import React, { useEffect, useRef } from 'react'
import { getStyle } from '@coreui/utils'
import { Chart as ChartJS, registerables } from 'chart.js';
import { CChart, CChartLine } from '@coreui/react-chartjs'

import zoomPlugin from 'chartjs-plugin-zoom';
ChartJS.register(...registerables, zoomPlugin);

export const TrainingGraph = ({ epoch, trainLoss, valLoss, clearView }) => {
  const chartRef = useRef(null);

  useEffect(() => {
    const handleColorSchemeChange = () => {
      const chartInstance = chartRef.current
      if (chartInstance) {
        const { options } = chartInstance

        if (options.plugins?.legend?.labels) {
          options.plugins.legend.labels.color = getStyle('--cui-body-color')
        }

        if (options.scales?.x) {
          if (options.scales.x.grid) {
            options.scales.x.grid.color = getStyle('--cui-border-color-translucent')
          }
          if (options.scales.x.ticks) {
            options.scales.x.ticks.color = getStyle('--cui-body-color')
          }
        }

        if (options.scales?.y) {
          if (options.scales.y.grid) {
            options.scales.y.grid.color = getStyle('--cui-border-color-translucent')
          }
          if (options.scales.y.ticks) {
            options.scales.y.ticks.color = getStyle('--cui-body-color')
          }
        }

        chartInstance.update()
      }
    }

    document.documentElement.addEventListener('ColorSchemeChange', handleColorSchemeChange)

    return () => {
      document.documentElement.removeEventListener('ColorSchemeChange', handleColorSchemeChange)
    }
  }, [])


  let epochProccessed = epoch;
  let trainLossProccessed = trainLoss || [];
  let valLossNullProccessed = valLoss || [];
  trainLossProccessed = trainLossProccessed.map(el => el == 0 ? null : el);
  valLossNullProccessed = valLossNullProccessed.map(el => el == 0 ? null : el);

  if (clearView) {
    const dropCondition = (index) => index % Math.ceil((index + 1) / 100) == 0;
    epochProccessed = epochProccessed.filter((_, index) => dropCondition(index));
    trainLossProccessed = trainLossProccessed.filter((_, index) => dropCondition(index));
    valLossNullProccessed = valLossNullProccessed.filter((_, index) => dropCondition(index));
  }

  const data = {
    labels: epochProccessed,
    datasets: [
      {
        label: 'Validation loss',
        data: valLossNullProccessed,
        borderColor: 'orange',
        borderWidth: 1,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointRadius: 3,
      },
      {
        label: 'Train loss',
        data: trainLossProccessed,
        borderColor: 'gray',
        borderWidth: 1,
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
        pointRadius: 3,
      },
    ],
  }

  const options = {
    spanGaps: true,
    plugins: {
      legend: {
        labels: {
          color: getStyle('--cui-body-color'),
        },
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
          modifierKey: 'ctrl',
          scaleMode: 'x',
          threshold: 10,
        },
        zoom: {
          wheel: {
            enabled: true,
            speed: 0.1,
          },
          pinch: {
            enabled: true,
          },
          drag: {
            enabled: true,
            threshold: 10,
          },
          mode: 'x',
        },
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: getStyle('--cui-body-color'),
        },
      },
      y: {
        grid: {
          color: getStyle('--cui-border-color-translucent'),
        },
        ticks: {
          color: getStyle('--cui-body-color'),
        },
        beginAtZero: true,
      },
    },
  }
  return <CChartLine data={data} options={options} />
}

export default TrainingGraph;