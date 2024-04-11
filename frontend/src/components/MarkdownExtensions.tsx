import { Components} from 'react-markdown'
import AudioPlayer from './AudioPlayer'
import ImageElement from './ImageElement'
import { nord } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

export default function MarkDownExtensions(): Partial<Components> | null | undefined {
  return {
    code(props) {
      const { children, className, ...rest } = props
      const match = /language-(\w+)/.exec(className || '')
      return match ? (
        <SyntaxHighlighter
          PreTag="div"
          children={String(children).replace(/\n$/, '')}
          language={match[1]}
          style={nord}
        />
      ) : (
        <code {...rest} className={className}>
          {children}
        </code>
      )
    },
    audio: AudioPlayer as any,
    img: ImageElement,
  }
}
