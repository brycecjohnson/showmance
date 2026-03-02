import './UpdateToast.css';

interface UpdateToastProps {
  onRefresh: () => void;
}

export function UpdateToast({ onRefresh }: UpdateToastProps) {
  return (
    <div className="update-toast">
      <span className="update-toast__message">
        A new version is available
      </span>
      <button className="update-toast__btn" onClick={onRefresh} type="button">
        Refresh
      </button>
    </div>
  );
}
