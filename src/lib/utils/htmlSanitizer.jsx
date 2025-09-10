/**
 * HTML Sanitizer utility to prevent XSS attacks
 * Provides safe alternatives to dangerouslySetInnerHTML
 */

/**
 * Sanitize HTML content by removing dangerous elements and attributes
 * This is a basic sanitizer - for production use, consider DOMPurify
 * @param {string} html - HTML string to sanitize
 * @returns {string} - Sanitized HTML string
 */
export function sanitizeHtml(html) {
  if (typeof html !== 'string') return ''
  
  // Create a temporary DOM element to parse HTML
  const temp = document.createElement('div')
  temp.innerHTML = html
  
  // Remove all script tags and event handlers
  const scripts = temp.querySelectorAll('script')
  scripts.forEach(script => script.remove())
  
  // Remove dangerous attributes
  const dangerousAttributes = [
    'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout',
    'onfocus', 'onblur', 'onchange', 'onsubmit', 'onreset',
    'onkeydown', 'onkeyup', 'onkeypress', 'javascript:'
  ]
  
  // Walk through all elements and sanitize
  const allElements = temp.querySelectorAll('*')
  allElements.forEach(element => {
    // Remove dangerous attributes
    dangerousAttributes.forEach(attr => {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr)
      }
    })
    
    // Check for javascript: in href and src
    if (element.hasAttribute('href')) {
      const href = element.getAttribute('href')
      if (href && href.toLowerCase().startsWith('javascript:')) {
        element.removeAttribute('href')
      }
    }
    
    if (element.hasAttribute('src')) {
      const src = element.getAttribute('src')
      if (src && src.toLowerCase().startsWith('javascript:')) {
        element.removeAttribute('src')
      }
    }
  })
  
  return temp.innerHTML
}

/**
 * Safe component for rendering sanitized HTML
 * @param {Object} props - Component props
 * @param {string} props.html - HTML content to render
 * @param {string} props.className - CSS class name
 * @param {Object} props.style - Inline styles
 * @param {boolean} props.allowedTags - Array of allowed HTML tags (default: basic formatting)
 * @returns {JSX.Element} - React element with sanitized content
 */
export function SafeHtml({ html, className, style, allowedTags = ['span', 'strong', 'em', 'b', 'i', 'u'] }) {
  if (!html || typeof html !== 'string') {
    return null
  }
  
  // Create temp element for processing
  const temp = document.createElement('div')
  temp.innerHTML = html
  
  // Remove all elements not in allowedTags
  const allElements = temp.querySelectorAll('*')
  allElements.forEach(element => {
    if (!allowedTags.includes(element.tagName.toLowerCase())) {
      // Replace with text content instead of removing completely
      const textNode = document.createTextNode(element.textContent || '')
      element.parentNode?.replaceChild(textNode, element)
    }
  })
  
  const sanitizedHtml = sanitizeHtml(temp.innerHTML)
  
  return (
    <div 
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}

/**
 * Safe template replacement that avoids HTML injection
 * @param {string} template - Template string with placeholders
 * @param {Object} replacements - Object with replacement values
 * @param {string} highlightClass - CSS class for highlighted replacements
 * @returns {JSX.Element} - React element with safe content
 */
export function SafeTemplate({ template, replacements = {}, highlightClass = 'highlight' }) {
  if (!template || typeof template !== 'string') {
    return null
  }
  
  // Split template by placeholders while preserving the structure
  const parts = []
  let currentIndex = 0
  
  // Find all placeholders in the template
  const placeholderRegex = /__([A-Z_]+)__/g
  let match
  
  while ((match = placeholderRegex.exec(template)) !== null) {
    const placeholder = match[0]
    const key = match[1].toLowerCase()
    const matchStart = match.index
    
    // Add text before placeholder
    if (matchStart > currentIndex) {
      parts.push({
        type: 'text',
        content: template.slice(currentIndex, matchStart)
      })
    }
    
    // Add placeholder replacement
    const replacement = replacements[key] || placeholder
    parts.push({
      type: 'replacement',
      content: replacement,
      key: key
    })
    
    currentIndex = matchStart + placeholder.length
  }
  
  // Add remaining text
  if (currentIndex < template.length) {
    parts.push({
      type: 'text',
      content: template.slice(currentIndex)
    })
  }
  
  // Render parts as React elements
  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'replacement') {
          return (
            <span key={`${part.key}-${index}`} className={highlightClass}>
              {part.content}
            </span>
          )
        } else {
          return <span key={`text-${index}`}>{part.content}</span>
        }
      })}
    </>
  )
}

/**
 * Escape HTML entities to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') return ''
  
  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }
  
  return text.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char)
}