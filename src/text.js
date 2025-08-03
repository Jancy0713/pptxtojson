import { getHorizontalAlign } from './align'
import { getTextByPathList } from './utils'

// 提取纯文本内容的函数
export function extractPlainText(textBodyNode) {
  if (!textBodyNode) return ''

  let plainText = ''
  const pNode = textBodyNode['a:p']
  const pNodes = pNode.constructor === Array ? pNode : [pNode]

  for (const pNode of pNodes) {
    let rNode = pNode['a:r']
    let fldNode = pNode['a:fld']
    let brNode = pNode['a:br']

    if (rNode) {
      rNode = (rNode.constructor === Array) ? rNode : [rNode]

      if (fldNode) {
        fldNode = (fldNode.constructor === Array) ? fldNode : [fldNode]
        rNode = rNode.concat(fldNode)
      }
      if (brNode) {
        brNode = (brNode.constructor === Array) ? brNode : [brNode]
        brNode.forEach(item => item.type = 'br')
        if (brNode.length > 1) brNode.shift()
        rNode = rNode.concat(brNode)
        rNode.sort((a, b) => {
          if (!a.attrs || !b.attrs) return true
          return a.attrs.order - b.attrs.order
        })
      }
    }

    const rNodes = rNode ? rNode : [pNode]
    for (const rNodeItem of rNodes) {
      if (rNodeItem.type === 'br') {
        plainText += '\n'
      }
      else {
        let text = rNodeItem['a:t']
        if (typeof text !== 'string') text = getTextByPathList(rNodeItem, ['a:fld', 'a:t'])
        if (typeof text === 'string') plainText += text
      }
    }
    plainText += '\n' // 段落换行
  }

  return plainText.trim()
}

import {
  getFontType,
  getFontColor,
  getFontSize,
  getFontBold,
  getFontItalic,
  getFontDecoration,
  getFontDecorationLine,
  getFontSpace,
  getFontSubscript,
  getFontShadow,
} from './fontStyle'

export function genTextBody(textBodyNode, spNode, slideLayoutSpNode, type, warpObj) {
  if (!textBodyNode) return { content: '', hasRealText: false }

  let text = ''
  let hasRealText = false // 标记是否有真实的文本内容

  const pFontStyle = getTextByPathList(spNode, ['p:style', 'a:fontRef'])

  const pNode = textBodyNode['a:p']
  const pNodes = pNode.constructor === Array ? pNode : [pNode]

  let isList = ''

  for (const pNode of pNodes) {
    let rNode = pNode['a:r']
    let fldNode = pNode['a:fld']
    let brNode = pNode['a:br']
    if (rNode) {
      rNode = (rNode.constructor === Array) ? rNode : [rNode]

      if (fldNode) {
        fldNode = (fldNode.constructor === Array) ? fldNode : [fldNode]
        rNode = rNode.concat(fldNode)
      }
      if (brNode) {
        brNode = (brNode.constructor === Array) ? brNode : [brNode]
        brNode.forEach(item => item.type = 'br')
  
        if (brNode.length > 1) brNode.shift()
        rNode = rNode.concat(brNode)
        rNode.sort((a, b) => {
          if (!a.attrs || !b.attrs) return true
          return a.attrs.order - b.attrs.order
        })
      }
    }

    const align = getHorizontalAlign(pNode, spNode, type, warpObj)

    const listType = getListType(pNode)
    if (listType) {
      if (!isList) {
        text += `<${listType}>`
        isList = listType
      }
      else if (isList && isList !== listType) {
        text += `</${isList}>`
        text += `<${listType}>`
        isList = listType
      }
      text += `<li style="text-align: ${align};">`
    }
    else {
      if (isList) {
        text += `</${isList}>`
        isList = ''
      }
      text += `<p style="text-align: ${align};">`
    }
    
    const rNodes = rNode ? rNode : [pNode]
    for (const rNodeItem of rNodes) {
      const spanResult = genSpanElement(rNodeItem, pNode, textBodyNode, pFontStyle, slideLayoutSpNode, type, warpObj)
      text += spanResult.content
      if (spanResult.hasRealText) hasRealText = true
    }

    if (listType) text += '</li>'
    else text += '</p>'
  }
  return { content: text, hasRealText }
}

export function getListType(node) {
  const pPrNode = node['a:pPr']
  if (!pPrNode) return ''

  if (pPrNode['a:buChar']) return 'ul'
  if (pPrNode['a:buAutoNum']) return 'ol'
  
  return ''
}

export function genSpanElement(node, pNode, textBodyNode, pFontStyle, slideLayoutSpNode, type, warpObj) {
  const lstStyle = textBodyNode['a:lstStyle']
  const slideMasterTextStyles = warpObj['slideMasterTextStyles']

  let lvl = 1
  const pPrNode = pNode['a:pPr']
  const lvlNode = getTextByPathList(pPrNode, ['attrs', 'lvl'])
  if (lvlNode !== undefined) lvl = parseInt(lvlNode) + 1

  let text = node['a:t']
  if (typeof text !== 'string') text = getTextByPathList(node, ['a:fld', 'a:t'])

  // 检查是否有真实的文本内容
  const hasRealText = typeof text === 'string' && text.trim() !== ''

  // 如果没有真实文本，使用&nbsp;作为占位
  if (typeof text !== 'string') text = '&nbsp;'

  let styleText = ''
  const fontColor = getFontColor(node, pNode, lstStyle, pFontStyle, lvl, warpObj)
  const fontSize = getFontSize(node, slideLayoutSpNode, type, slideMasterTextStyles)
  const fontType = getFontType(node, type, warpObj)
  const fontBold = getFontBold(node)
  const fontItalic = getFontItalic(node)
  const fontDecoration = getFontDecoration(node)
  const fontDecorationLine = getFontDecorationLine(node)
  const fontSpace = getFontSpace(node)
  const shadow = getFontShadow(node, warpObj)
  const subscript = getFontSubscript(node)

  if (fontColor) styleText += `color: ${fontColor};`
  if (fontSize) styleText += `font-size: ${fontSize};`
  if (fontType) styleText += `font-family: ${fontType};`
  if (fontBold) styleText += `font-weight: ${fontBold};`
  if (fontItalic) styleText += `font-style: ${fontItalic};`
  if (fontDecoration) styleText += `text-decoration: ${fontDecoration};`
  if (fontDecorationLine) styleText += `text-decoration-line: ${fontDecorationLine};`
  if (fontSpace) styleText += `letter-spacing: ${fontSpace};`
  if (subscript) styleText += `vertical-align: ${subscript};`
  if (shadow) styleText += `text-shadow: ${shadow};`

  const linkID = getTextByPathList(node, ['a:rPr', 'a:hlinkClick', 'attrs', 'r:id'])
  if (linkID) {
    const linkURL = warpObj['slideResObj'][linkID]['target']
    return {
      content: `<span style="${styleText}"><a href="${linkURL}" target="_blank">${text.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/\s/g, '&nbsp;')}</a></span>`,
      hasRealText
    }
  }
  return {
    content: `<span style="${styleText}">${text.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;').replace(/\s/g, '&nbsp;')}</span>`,
    hasRealText
  }
}
