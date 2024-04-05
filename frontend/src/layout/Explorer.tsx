import './Explorer.css';


export default function Explorer({ children }: { children?: React.ReactNode }) {
  return (
    <div className="explorer-container">
      {children}
    </div>
  );
};
