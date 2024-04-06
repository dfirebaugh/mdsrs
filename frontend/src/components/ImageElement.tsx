export default function ImageElement({src}: {src?: string}) {
  return (
    <div>
      <img src={src} alt="random image" />
    </div>
  );
}