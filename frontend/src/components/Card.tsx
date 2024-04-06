import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { nord } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import emoji from 'remark-gemoji';
import IconButton from './IconButton'
import AudioPlayer from './AudioPlayer'
import ImageElement from './ImageElement'

export default function Card({ children, setEditingCardId, setEditingCardName, id }: {
  children?: React.ReactNode,
  name?: string,
  id?: string,
  setEditingCardId?: (id: string) => void
  setEditingCardName?: (name: string) => void,
}
) {
  const content = typeof children === 'string' ? children : JSON.stringify(children);

  return <>
    <Markdown
      remarkPlugins={[remarkGfm, emoji]}
      rehypePlugins={[rehypeRaw]}
      components={{
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
        audio({src}) {
          return <AudioPlayer src={src} />;
        },
        img({src}) {
          return <ImageElement src={src} />;
        },
      }}>
      {content}
    </Markdown>
    {!!setEditingCardId && <IconButton icon="material-symbols:edit" onClick={() => setEditingCardId(id || "")} />}
  </>
}
