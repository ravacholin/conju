import React, { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { ERROR_TAGS } from '../../lib/progress/dataModels.js'
import './InteractiveErrorVisualizations.css'

export default function InteractiveErrorVisualizations({
  attempts = [],
  timelineData = [],
  onErrorFocus,
  onTimeRangeSelect
}) {
  const [activeVisualization, setActiveVisualization] = useState('constellation')
  const [selectedErrorType, setSelectedErrorType] = useState(null)
  const [timeRange, setTimeRange] = useState('30days')

  return (
    <div className="interactive-error-visualizations">
      <div className="visualization-controls">
        <div className="viz-selector">
          <button
            className={`viz-btn ${activeVisualization === 'constellation' ? 'active' : ''}`}
            onClick={() => setActiveVisualization('constellation')}
          >
             Constelación
          </button>
          <button
            className={`viz-btn ${activeVisualization === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveVisualization('timeline')}
          >
             Timeline
          </button>
          <button
            className={`viz-btn ${activeVisualization === 'heatmap' ? 'active' : ''}`}
            onClick={() => setActiveVisualization('heatmap')}
          >
             Heatmap
          </button>
          <button
            className={`viz-btn ${activeVisualization === 'network' ? 'active' : ''}`}
            onClick={() => setActiveVisualization('network')}
          >
            ️ Red
          </button>
        </div>

        <div className="time-range-selector">
          <select
            value={timeRange}
            onChange={(event) => {
              const nextRange = event.target.value
              setTimeRange(nextRange)
              onTimeRangeSelect?.(nextRange)
            }}
            className="time-range-select"
          >
            <option value="7days">Últimos 7 días</option>
            <option value="30days">Últimos 30 días</option>
            <option value="90days">Últimos 3 meses</option>
            <option value="all">Todo el tiempo</option>
          </select>
        </div>
      </div>

      <div className="visualization-container">
        {activeVisualization === 'constellation' && (
          <ErrorConstellationMap
            attempts={attempts}
            timeRange={timeRange}
            onErrorFocus={onErrorFocus}
            selectedError={selectedErrorType}
            onErrorSelect={setSelectedErrorType}
          />
        )}

        {activeVisualization === 'timeline' && (
          <AdvancedErrorTimeline
            timelineData={timelineData}
            attempts={attempts}
            timeRange={timeRange}
          />
        )}

        {activeVisualization === 'heatmap' && (
          <ErrorHeatmapEvolution
            attempts={attempts}
            timeRange={timeRange}
          />
        )}

        {activeVisualization === 'network' && (
          <ErrorNetworkGraph
            attempts={attempts}
            timeRange={timeRange}
            onErrorFocus={onErrorFocus}
          />
        )}
      </div>
    </div>
  )
}

// Mapa de Constelación de Errores - Visualiza errores como estrellas agrupadas
function ErrorConstellationMap({ attempts, timeRange, onErrorFocus, selectedError, onErrorSelect }) {
  const canvasRef = useRef(null)
  const [hoveredError, setHoveredError] = useState(null)

  const processedData = useMemo(() => {
    return processConstellationData(attempts, timeRange)
  }, [attempts, timeRange])

  useEffect(() => {
    if (!canvasRef.current) return
    drawConstellation(canvasRef.current, processedData, hoveredError, selectedError)
  }, [processedData, hoveredError, selectedError])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Encontrar error más cercano
      let closestError = null
      let minDistance = Infinity

      processedData.errorClusters.forEach(cluster => {
        cluster.stars.forEach(star => {
          const distance = Math.sqrt(
            Math.pow(x - star.x, 2) + Math.pow(y - star.y, 2)
          )
          if (distance < star.radius + 10 && distance < minDistance) {
            minDistance = distance
            closestError = {
              ...star,
              clusterName: cluster.name,
              clusterColor: cluster.color
            }
          }
        })
      })

      setHoveredError(closestError)
      canvas.style.cursor = closestError ? 'pointer' : 'default'
    }

    const handleClick = () => {
      if (hoveredError) {
        onErrorSelect?.(hoveredError.errorType)
        onErrorFocus?.(hoveredError.errorType, hoveredError.examples)
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleClick)

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleClick)
    }
  }, [processedData, hoveredError, onErrorFocus, onErrorSelect])

  return (
    <div className="error-constellation">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="constellation-canvas"
      />

      {hoveredError && (
        <div
          className="constellation-tooltip"
          style={{
            left: hoveredError.x + 20,
            top: hoveredError.y - 50
          }}
        >
          <div className="tooltip-header">
            <strong>{getErrorTagLabel(hoveredError.errorType)}</strong>
          </div>
          <div className="tooltip-stats">
            <div>Frecuencia: {hoveredError.count}</div>
            <div>Cluster: {hoveredError.clusterName}</div>
          </div>
        </div>
      )}

      <div className="constellation-legend">
        <h4>Constelaciones de Errores</h4>
        {processedData.errorClusters.map((cluster, index) => (
          <div key={index} className="legend-item">
            <div
              className="legend-color"
              
            ></div>
            <span>{cluster.name}</span>
            <span className="legend-count">({cluster.totalErrors})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Timeline Avanzado con contexto emocional
function AdvancedErrorTimeline({ timelineData, attempts, timeRange }) {
  const svgRef = useRef(null)
  const [selectedPeriod, setSelectedPeriod] = useState(null)

  const processedTimeline = useMemo(() => {
    return processTimelineData(timelineData, attempts, timeRange)
  }, [timelineData, attempts, timeRange])

  useEffect(() => {
    if (!svgRef.current) return
    drawAdvancedTimeline(svgRef.current, processedTimeline, selectedPeriod, setSelectedPeriod)
  }, [processedTimeline, selectedPeriod])

  return (
    <div className="advanced-timeline">
      <div className="timeline-header">
        <h3> Timeline de Errores con Contexto Emocional</h3>
        <div className="timeline-metrics">
          <div className="metric">
            <span className="metric-value">{processedTimeline.totalErrors}</span>
            <span className="metric-label">Total Errores</span>
          </div>
          <div className="metric">
            <span className="metric-value">{Math.round(processedTimeline.avgErrorRate * 100)}%</span>
            <span className="metric-label">Tasa Promedio</span>
          </div>
          <div className="metric">
            <span className="metric-value">{processedTimeline.peakErrorDay}</span>
            <span className="metric-label">Peor Día</span>
          </div>
        </div>
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height="400"
        className="timeline-svg"
      />

      {selectedPeriod && (
        <div className="timeline-detail-panel">
          <h4>Análisis del Período: {selectedPeriod.date}</h4>
          <div className="period-stats">
            <div className="stat-grid">
              <div className="stat-item">
                <span className="stat-label">Errores:</span>
                <span className="stat-value">{selectedPeriod.errorCount}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total intentos:</span>
                <span className="stat-value">{selectedPeriod.totalAttempts}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Estado emocional dominante:</span>
                <span className="stat-value">{selectedPeriod.emotionalState}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Error más común:</span>
                <span className="stat-value">{selectedPeriod.topError}</span>
              </div>
            </div>

            <div className="error-breakdown">
              <h5>Distribución de Errores:</h5>
              {Object.entries(selectedPeriod.errorDistribution || {}).map(([error, count]) => (
                <div key={error} className="error-bar-container">
                  <span className="error-label">{getErrorTagLabel(error)}</span>
                  <div className="error-bar">
                    <div
                      className="error-bar-fill"
                      style={{
                        width: `${(count / selectedPeriod.errorCount) * 100}%`,
                        backgroundColor: getErrorColor(error)
                      }}
                    ></div>
                  </div>
                  <span className="error-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Heatmap de Evolución de Errores
function ErrorHeatmapEvolution({ attempts, timeRange }) {
  const canvasRef = useRef(null)
  const [selectedCell, setSelectedCell] = useState(null)

  const heatmapData = useMemo(() => {
    return processHeatmapData(attempts, timeRange)
  }, [attempts, timeRange])

  useEffect(() => {
    if (!canvasRef.current) return
    drawHeatmapEvolution(canvasRef.current, heatmapData, selectedCell, setSelectedCell)
  }, [heatmapData, selectedCell])

  return (
    <div className="heatmap-evolution">
      <div className="heatmap-controls">
        <h3> Evolución de Errores por Tipo y Tiempo</h3>
        <div className="heatmap-legend">
          <span>Menos errores</span>
          <div className="color-solid"></div>
          <span>Más errores</span>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        className="heatmap-canvas"
      />

      {selectedCell && (
        <div className="heatmap-details">
          <h4>Detalles: {selectedCell.errorType} - {selectedCell.timePeriod}</h4>
          <div className="cell-stats">
            <div>Errores: {selectedCell.errorCount}</div>
            <div>Intensidad: {Math.round(selectedCell.intensity * 100)}%</div>
            <div>Tendencia: {selectedCell.trend}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Grafo de Red de Errores - Muestra relaciones entre tipos de error
function ErrorNetworkGraph({ attempts, timeRange, onErrorFocus }) {
  const svgRef = useRef(null)
  const [networkData, setNetworkData] = useState({ nodes: [], links: [] })
  const [selectedNode, setSelectedNode] = useState(null)

  const processedNetwork = useMemo(() => {
    return processNetworkData(attempts, timeRange)
  }, [attempts, timeRange])

  useEffect(() => {
    setNetworkData(processedNetwork)
  }, [processedNetwork])

  useEffect(() => {
    if (!svgRef.current || !networkData.nodes.length) return
    drawErrorNetwork(svgRef.current, networkData, selectedNode, setSelectedNode)
  }, [networkData, selectedNode])

  return (
    <div className="error-network">
      <div className="network-header">
        <h3>️ Red de Correlaciones de Errores</h3>
        <p>Los errores conectados tienden a ocurrir juntos</p>
      </div>

      <svg
        ref={svgRef}
        width={700}
        height={500}
        className="network-svg"
      />

      {selectedNode && (
        <div className="network-details">
          <h4>{getErrorTagLabel(selectedNode.errorType)}</h4>
          <div className="node-stats">
            <div>Frecuencia: {selectedNode.frequency}</div>
            <div>Conexiones: {selectedNode.connections}</div>
            <div>Centralidad: {Math.round(selectedNode.centrality * 100)}%</div>
          </div>

          <div className="connected-errors">
            <h5>Errores Relacionados:</h5>
            {selectedNode.relatedErrors.map((related, index) => (
              <div key={index} className="related-error">
                <span>{getErrorTagLabel(related.errorType)}</span>
                <span className="correlation-strength">
                  {Math.round(related.correlation * 100)}%
                </span>
              </div>
            ))}
          </div>

          <button
            className="focus-error-btn"
            onClick={() => onErrorFocus?.(selectedNode.errorType)}
          >
            Enfocar en este Error
          </button>
        </div>
      )}
    </div>
  )
}

// Funciones de procesamiento de datos
function processConstellationData(attempts, timeRange) {
  const filteredAttempts = filterByTimeRange(attempts, timeRange)
  const errorGroups = groupErrorsByType(filteredAttempts)

  // Agrupar errores en constelaciones temáticas
  const constellations = {
    'Morfología Verbal': [ERROR_TAGS.VERBAL_ENDING, ERROR_TAGS.IRREGULAR_STEM],
    'Ortografía': [ERROR_TAGS.ORTHOGRAPHY_C_QU, ERROR_TAGS.ORTHOGRAPHY_G_GU, ERROR_TAGS.ORTHOGRAPHY_Z_C, ERROR_TAGS.ACCENT],
    'Sintaxis': [ERROR_TAGS.WRONG_PERSON, ERROR_TAGS.WRONG_MOOD, ERROR_TAGS.WRONG_TENSE, ERROR_TAGS.CLITIC_PRONOUNS],
    'Variación': [ERROR_TAGS.OTHER_VALID_FORM]
  }

  const errorClusters = []
  const shades = [0.75, 0.6, 0.48, 0.36, 0.28]

  Object.entries(constellations).forEach(([name, errorTypes], index) => {
    const clusterData = {
      name,
      color: `rgba(255, 255, 255, ${shades[index % shades.length]})`,
      stars: [],
      totalErrors: 0
    }

    errorTypes.forEach((errorType, typeIndex) => {
      const errorData = errorGroups[errorType]
      if (errorData && errorData.length > 0) {
        // Posicionar estrellas en el cluster
        const centerX = 200 + (index * 150)
        const centerY = 200 + (Math.sin(index * Math.PI / 2) * 100)

        const star = {
          x: centerX + (Math.cos(typeIndex * Math.PI / 4) * 60),
          y: centerY + (Math.sin(typeIndex * Math.PI / 4) * 60),
          radius: Math.min(30, 8 + Math.sqrt(errorData.length) * 3),
          errorType,
          count: errorData.length,
          examples: errorData.slice(0, 3)
        }

        clusterData.stars.push(star)
        clusterData.totalErrors += errorData.length
      }
    })

    if (clusterData.stars.length > 0) {
      errorClusters.push(clusterData)
    }
  })

  return { errorClusters }
}

function processTimelineData(timelineData, attempts, timeRange) {
  const filteredData = timelineData.filter(day => {
    const daysAgo = (Date.now() - new Date(day.date)) / (1000 * 60 * 60 * 24)
    switch (timeRange) {
      case '7days': return daysAgo <= 7
      case '30days': return daysAgo <= 30
      case '90days': return daysAgo <= 90
      default: return true
    }
  })

  const totalErrors = filteredData.reduce((sum, day) => sum + day.errorCount, 0)
  const avgErrorRate = filteredData.length > 0
    ? filteredData.reduce((sum, day) => sum + day.errorRate, 0) / filteredData.length
    : 0

  const peakErrorDay = filteredData
    .sort((a, b) => b.errorRate - a.errorRate)[0]?.date || 'N/A'

  return {
    timeline: filteredData,
    totalErrors,
    avgErrorRate,
    peakErrorDay
  }
}

function processHeatmapData(attempts, timeRange) {
  const filteredAttempts = filterByTimeRange(attempts, timeRange)

  // Crear matriz de tiempo vs tipo de error
  const timeSlots = generateTimeSlots(timeRange)
  const errorTypes = Object.values(ERROR_TAGS)

  const matrix = {}

  timeSlots.forEach(slot => {
    matrix[slot] = {}
    errorTypes.forEach(errorType => {
      matrix[slot][errorType] = 0
    })
  })

  // Llenar matriz con datos reales
  filteredAttempts.forEach(attempt => {
    if (!attempt.correct && Array.isArray(attempt.errorTags)) {
      const timeSlot = getTimeSlot(attempt.createdAt, timeRange)
      attempt.errorTags.forEach(tag => {
        if (matrix[timeSlot] && matrix[timeSlot][tag] !== undefined) {
          matrix[timeSlot][tag]++
        }
      })
    }
  })

  return { matrix, timeSlots, errorTypes }
}

function processNetworkData(attempts, timeRange) {
  const filteredAttempts = filterByTimeRange(attempts, timeRange)
  const coOccurrenceMatrix = {}
  const errorCounts = {}

  // Calcular co-ocurrencias de errores
  filteredAttempts.forEach(attempt => {
    if (!attempt.correct && Array.isArray(attempt.errorTags) && attempt.errorTags.length > 1) {
      attempt.errorTags.forEach(tag => {
        errorCounts[tag] = (errorCounts[tag] || 0) + 1

        attempt.errorTags.forEach(otherTag => {
          if (tag !== otherTag) {
            const key = [tag, otherTag].sort().join('|')
            coOccurrenceMatrix[key] = (coOccurrenceMatrix[key] || 0) + 1
          }
        })
      })
    }
  })

  // Crear nodos
  const nodes = Object.entries(errorCounts).map(([errorType, frequency]) => ({
    id: errorType,
    errorType,
    frequency,
    connections: 0,
    centrality: 0,
    relatedErrors: []
  }))

  // Crear links
  const links = []
  Object.entries(coOccurrenceMatrix).forEach(([key, count]) => {
    const [source, target] = key.split('|')
    if (count > 2) { // Solo mostrar correlaciones significativas
      const correlation = count / Math.min(errorCounts[source], errorCounts[target])
      links.push({
        source,
        target,
        weight: count,
        correlation
      })

      // Actualizar información de nodos
      const sourceNode = nodes.find(n => n.id === source)
      const targetNode = nodes.find(n => n.id === target)

      if (sourceNode) {
        sourceNode.connections++
        sourceNode.relatedErrors.push({ errorType: target, correlation })
      }

      if (targetNode) {
        targetNode.connections++
        targetNode.relatedErrors.push({ errorType: source, correlation })
      }
    }
  })

  // Calcular centralidad
  nodes.forEach(node => {
    node.centrality = node.connections / Math.max(1, nodes.length - 1)
  })

  return { nodes, links }
}

// Funciones de dibujo (simplificadas por espacio)
function drawConstellation(canvas, data, hoveredError, selectedError) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Dibujar fondo estrellado
  drawStarField(ctx, canvas.width, canvas.height)

  // Dibujar clusters
  data.errorClusters.forEach(cluster => {
    // Dibujar conexiones entre estrellas del cluster
    drawClusterConnections(ctx, cluster)

    // Dibujar estrellas
    cluster.stars.forEach(star => {
      drawStar(ctx, star, cluster.color,
        hoveredError?.errorType === star.errorType,
        selectedError === star.errorType
      )
    })

    // Dibujar etiqueta del cluster
    drawClusterLabel(ctx, cluster)
  })
}

function drawAdvancedTimeline(svg, data, selectedPeriod, setSelectedPeriod) {
  // Limpiar SVG anterior
  svg.innerHTML = ''

  if (!data.timeline || data.timeline.length === 0) return

  // Configuración
  const margin = { top: 20, right: 30, bottom: 60, left: 60 }
  const width = svg.clientWidth - margin.left - margin.right
  const height = 400 - margin.top - margin.bottom

  // Crear escalas
  const xScale = d3.scaleTime()
    .domain(d3.extent(data.timeline, d => new Date(d.date)))
    .range([0, width])

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data.timeline, d => d.errorRate)])
    .range([height, 0])

  // SVG setup
  const g = d3.select(svg)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Dibujar área de errores
  const area = d3.area()
    .x(d => xScale(new Date(d.date)))
    .y0(height)
    .y1(d => yScale(d.errorRate))
    .curve(d3.curveCardinal)

  g.append('path')
    .datum(data.timeline)
    .attr('class', 'error-area')
    .attr('d', area)
    .style('fill', 'rgba(220, 53, 69, 0.2)')
    .style('stroke', '#dc3545')
    .style('stroke-width', 2)

  // Dibujar puntos interactivos
  g.selectAll('.timeline-point')
    .data(data.timeline)
    .enter()
    .append('circle')
    .attr('class', 'timeline-point')
    .attr('cx', d => xScale(new Date(d.date)))
    .attr('cy', d => yScale(d.errorRate))
    .attr('r', d => 3 + Math.sqrt(d.errorCount))
    .style('fill', d => getEmotionalColor(d.dominantEmotion))
    .style('stroke', '#fff')
    .style('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('click', (event, d) => setSelectedPeriod(d))

  // Ejes
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))

  g.append('g')
    .call(d3.axisLeft(yScale))
}

function drawHeatmapEvolution(canvas, data, selectedCell, setSelectedCell) {
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  if (!data.matrix) return

  const { matrix, timeSlots, errorTypes } = data
  const cellWidth = canvas.width / timeSlots.length
  const cellHeight = canvas.height / errorTypes.length

  // Encontrar valor máximo para normalización
  const maxValue = Math.max(...Object.values(matrix).flatMap(Object.values), 1)

  timeSlots.forEach((timeSlot, x) => {
    errorTypes.forEach((errorType, y) => {
      const value = matrix[timeSlot][errorType] || 0
      const intensity = value / maxValue

      // Color neutro basado en intensidad
      const shade = Math.round(70 + intensity * 140)
      ctx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, ${Math.max(0.18, intensity)})`

      const rectX = x * cellWidth
      const rectY = y * cellHeight

      ctx.fillRect(rectX, rectY, cellWidth, cellHeight)

      // Bordes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      ctx.strokeRect(rectX, rectY, cellWidth, cellHeight)

      const isSelected = selectedCell &&
        selectedCell.timePeriod === timeSlot &&
        selectedCell.errorType === errorType

      if (isSelected) {
        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.strokeRect(rectX, rectY, cellWidth, cellHeight)
      }

      // Texto si hay valor significativo
      if (value > 0) {
        ctx.fillStyle = intensity > 0.5 ? 'white' : 'black'
        ctx.font = '10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(value, rectX + cellWidth/2, rectY + cellHeight/2)
      }
    })
  })

  // Labels (simplificado)
  ctx.fillStyle = 'white'
  ctx.font = '12px Arial'
  ctx.textAlign = 'left'

  // Labels de tiempo
  timeSlots.forEach((timeSlot, x) => {
    ctx.fillText(timeSlot, x * cellWidth + 5, canvas.height - 5)
  })

  // Labels de errores
  errorTypes.forEach((errorType, y) => {
    ctx.save()
    ctx.translate(5, y * cellHeight + cellHeight/2)
    ctx.rotate(-Math.PI/2)
    ctx.fillText(getErrorTagLabel(errorType), 0, 0)
    ctx.restore()
  })

  canvas.onclick = (event) => {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const slotIndex = Math.floor(x / cellWidth)
    const errorIndex = Math.floor(y / cellHeight)

    const timeSlot = timeSlots[slotIndex]
    const errorType = errorTypes[errorIndex]

    if (!timeSlot || !errorType) {
      setSelectedCell?.(null)
      return
    }

    const value = matrix[timeSlot][errorType] || 0
    const intensity = maxValue ? value / maxValue : 0
    const trend = intensity > 0.6 ? 'alta' : intensity > 0.3 ? 'media' : 'baja'

    setSelectedCell?.({
      timeSlot,
      timePeriod: timeSlot,
      errorType,
      errorCount: value,
      intensity,
      trend
    })
  }
}

function drawErrorNetwork(svg, data, selectedNode, setSelectedNode) {
  // Usar D3.js para crear un gráfico de fuerza
  // Implementación simplificada por espacio
  svg.innerHTML = ''

  const width = 700
  const height = 500

  const simulation = d3.forceSimulation(data.nodes)
    .force('link', d3.forceLink(data.links).id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))

  const g = d3.select(svg).append('g')

  // Links
  const link = g.selectAll('.link')
    .data(data.links)
    .enter()
    .append('line')
    .attr('class', 'link')
    .style('stroke', '#999')
    .style('stroke-width', d => Math.sqrt(d.weight))

  // Nodes
  const node = g.selectAll('.node')
    .data(data.nodes)
    .enter()
    .append('circle')
    .attr('class', 'node')
    .attr('r', d => 5 + Math.sqrt(d.frequency))
    .style('fill', d => getErrorColor(d.errorType))
    .style('cursor', 'pointer')
    .on('click', (event, d) => setSelectedNode(d))

  // Labels
  const label = g.selectAll('.label')
    .data(data.nodes)
    .enter()
    .append('text')
    .attr('class', 'label')
    .text(d => getErrorTagLabel(d.errorType))
    .style('font-size', '10px')
    .style('fill', 'white')

  simulation.on('tick', () => {
    link.attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

    node.attr('cx', d => d.x)
        .attr('cy', d => d.y)

    label.attr('x', d => d.x)
         .attr('y', d => d.y + 4)
  })
}

// Funciones auxiliares
function filterByTimeRange(attempts, timeRange) {
  const now = Date.now()
  const ranges = {
    '7days': 7 * 24 * 60 * 60 * 1000,
    '30days': 30 * 24 * 60 * 60 * 1000,
    '90days': 90 * 24 * 60 * 60 * 1000,
    'all': Infinity
  }

  const cutoff = now - ranges[timeRange]
  return attempts.filter(attempt =>
    new Date(attempt.createdAt).getTime() >= cutoff
  )
}

function groupErrorsByType(attempts) {
  const groups = {}
  attempts.forEach(attempt => {
    if (!attempt.correct && Array.isArray(attempt.errorTags)) {
      attempt.errorTags.forEach(tag => {
        if (!groups[tag]) groups[tag] = []
        groups[tag].push(attempt)
      })
    }
  })
  return groups
}

function getErrorTagLabel(tag) {
  const labels = {
    [ERROR_TAGS.ACCENT]: 'Acentuación',
    [ERROR_TAGS.VERBAL_ENDING]: 'Terminaciones',
    [ERROR_TAGS.IRREGULAR_STEM]: 'Raíz Irregular',
    [ERROR_TAGS.WRONG_PERSON]: 'Persona',
    [ERROR_TAGS.WRONG_TENSE]: 'Tiempo',
    [ERROR_TAGS.WRONG_MOOD]: 'Modo',
    [ERROR_TAGS.CLITIC_PRONOUNS]: 'Clíticos',
    [ERROR_TAGS.ORTHOGRAPHY_C_QU]: 'Ortografía C/QU',
    [ERROR_TAGS.ORTHOGRAPHY_G_GU]: 'Ortografía G/GU',
    [ERROR_TAGS.ORTHOGRAPHY_Z_C]: 'Ortografía Z/C',
    [ERROR_TAGS.OTHER_VALID_FORM]: 'Otra Forma'
  }
  return labels[tag] || 'Error'
}

function getErrorColor(errorType) {
  const tones = {
    [ERROR_TAGS.ACCENT]: 'rgba(255, 255, 255, 0.75)',
    [ERROR_TAGS.VERBAL_ENDING]: 'rgba(255, 255, 255, 0.65)',
    [ERROR_TAGS.IRREGULAR_STEM]: 'rgba(255, 255, 255, 0.55)',
    [ERROR_TAGS.WRONG_PERSON]: 'rgba(255, 255, 255, 0.5)',
    [ERROR_TAGS.WRONG_TENSE]: 'rgba(255, 255, 255, 0.45)',
    [ERROR_TAGS.WRONG_MOOD]: 'rgba(255, 255, 255, 0.4)',
    [ERROR_TAGS.CLITIC_PRONOUNS]: 'rgba(255, 255, 255, 0.6)',
    [ERROR_TAGS.ORTHOGRAPHY_C_QU]: 'rgba(255, 255, 255, 0.5)',
    [ERROR_TAGS.ORTHOGRAPHY_G_GU]: 'rgba(255, 255, 255, 0.42)',
    [ERROR_TAGS.ORTHOGRAPHY_Z_C]: 'rgba(255, 255, 255, 0.38)',
    [ERROR_TAGS.OTHER_VALID_FORM]: 'rgba(255, 255, 255, 0.32)'
  }
  return tones[errorType] || 'rgba(255, 255, 255, 0.5)'
}

function getEmotionalColor(emotion) {
  const tones = {
    flow: 'rgba(255, 255, 255, 0.7)',
    frustrated: 'rgba(255, 255, 255, 0.45)',
    confident: 'rgba(255, 255, 255, 0.65)',
    neutral: 'rgba(255, 255, 255, 0.55)',
    struggling: 'rgba(255, 255, 255, 0.4)'
  }
  return tones[emotion] || 'rgba(255, 255, 255, 0.5)'
}

function drawStarField(ctx, width, height) {
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width
    const y = Math.random() * height
    const brightness = Math.random() * 0.8 + 0.2

    ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`
    ctx.beginPath()
    ctx.arc(x, y, 1, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawClusterConnections(ctx, cluster) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = 1

  for (let i = 0; i < cluster.stars.length; i++) {
    for (let j = i + 1; j < cluster.stars.length; j++) {
      const star1 = cluster.stars[i]
      const star2 = cluster.stars[j]

      ctx.beginPath()
      ctx.moveTo(star1.x, star1.y)
      ctx.lineTo(star2.x, star2.y)
      ctx.stroke()
    }
  }
}

function drawStar(ctx, star, color, isHovered, isSelected) {
  const glowRadius = isHovered ? star.radius * 1.5 : star.radius

  // Glow effect
  if (isHovered || isSelected) {
    const gradient = ctx.createRadialGradient(
      star.x, star.y, 0,
      star.x, star.y, glowRadius
    )
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.45)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(star.x, star.y, glowRadius, 0, Math.PI * 2)
    ctx.fill()
  }

  // Star
  ctx.fillStyle = color
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = isSelected ? 2 : 1

  ctx.beginPath()
  ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
  ctx.fill()

  if (isSelected) {
    ctx.stroke()
  }
}

function drawClusterLabel(ctx, cluster) {
  if (cluster.stars.length === 0) return

  // Calcular centro del cluster
  const centerX = cluster.stars.reduce((sum, star) => sum + star.x, 0) / cluster.stars.length
  const centerY = cluster.stars.reduce((sum, star) => sum + star.y, 0) / cluster.stars.length

  ctx.fillStyle = 'white'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(cluster.name, centerX, centerY - 80)

  ctx.font = '12px Arial'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.fillText(`${cluster.totalErrors} errores`, centerX, centerY - 65)
}

function generateTimeSlots(timeRange) {
  const slots = []
  const now = new Date()

  switch (timeRange) {
    case '7days':
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        slots.push(date.toISOString().split('T')[0])
      }
      break
    case '30days':
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        slots.push(date.toISOString().split('T')[0])
      }
      break
    default:
      // Simplificado para el ejemplo
      slots.push('Semana 1', 'Semana 2', 'Semana 3', 'Semana 4')
  }

  return slots
}

function getTimeSlot(dateString, timeRange) {
  const date = new Date(dateString)

  switch (timeRange) {
    case '7days':
    case '30days':
      return date.toISOString().split('T')[0]
    default:
      // Simplificado
      return 'Semana 1'
  }
}
