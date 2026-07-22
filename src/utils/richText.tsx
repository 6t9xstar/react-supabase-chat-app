import React from 'react'

const MENTION_RE = /@(\w[\w.-]*\w|\w)/g
const LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/
const BOLD_RE = /\*\*(.+?)\*\*/
const ITALIC_RE = /\*(.+?)\*/
const CODE_RE = /`([^`]+)`/
const STRIKE_RE = /~(.+?)~/

function parseSegment(text: string, idx: number): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let remaining = text

  while (remaining.length > 0) {
    const matches: { index: number; length: number; node: React.ReactNode }[] = []

    const m = remaining.match(LINK_RE)
    if (m) matches.push({ index: m.index!, length: m[0].length, node: React.createElement('a', { key: `l-${idx}-${m.index}`, href: m[2], target: '_blank', rel: 'noopener noreferrer', className: 'text-brand-500 underline hover:text-brand-400' }, m[1]) })

    const b = remaining.match(BOLD_RE)
    if (b) matches.push({ index: b.index!, length: b[0].length, node: React.createElement('strong', { key: `b-${idx}-${b.index}` }, b[1]) })

    const i = remaining.match(ITALIC_RE)
    if (i) matches.push({ index: i.index!, length: i[0].length, node: React.createElement('em', { key: `i-${idx}-${i.index}` }, i[1]) })

    const c = remaining.match(CODE_RE)
    if (c) matches.push({ index: c.index!, length: c[0].length, node: React.createElement('code', { key: `c-${idx}-${c.index}`, className: 'rounded bg-gray-200 dark:bg-[#333] px-1 text-xs font-mono' }, c[1]) })

    const s = remaining.match(STRIKE_RE)
    if (s) matches.push({ index: s.index!, length: s[0].length, node: React.createElement('s', { key: `s-${idx}-${s.index}` }, s[1]) })

    const at = remaining.match(MENTION_RE)
    if (at) matches.push({ index: at.index!, length: at[0].length, node: React.createElement('span', { key: `m-${idx}-${at.index}`, className: 'font-semibold text-brand-600 dark:text-brand-400' }, at[0]) })

    if (matches.length === 0) {
      const parts = remaining.split(/(\n\n+)/)
      for (let p = 0; p < parts.length; p++) {
        if (p % 2 === 0) {
          nodes.push(parts[p])
        } else {
          nodes.push(React.createElement('br', { key: `br-${idx}-${p}` }), React.createElement('br', { key: `br2-${idx}-${p}` }))
        }
      }
      break
    }

    matches.sort((a, b) => a.index - b.index)
    const first = matches[0]

    if (first.index > 0) {
      nodes.push(remaining.slice(0, first.index))
    }

    nodes.push(first.node)
    remaining = remaining.slice(first.index + first.length)
  }

  return nodes
}

interface RichTextProps {
  text: string
}

export default function RichText({ text }: RichTextProps) {
  const segments = text.split(/(\n\n+)/)
  const nodes: React.ReactNode[] = []

  for (let i = 0; i < segments.length; i++) {
    if (i % 2 === 0) {
      const parsed = parseSegment(segments[i], i)
      for (const n of parsed) nodes.push(n)
    } else {
      nodes.push(React.createElement('br', { key: `br-${i}` }), React.createElement('br', { key: `br2-${i}` }))
    }
  }

  return React.createElement(React.Fragment, null, ...nodes)
}
