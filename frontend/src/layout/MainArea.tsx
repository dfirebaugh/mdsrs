import "./MainArea.css"

export default function MainArea({ children }: { children?: React.ReactNode }) {
  return (
    <div className="main-area">
      {children}
    </div>
  );
}
