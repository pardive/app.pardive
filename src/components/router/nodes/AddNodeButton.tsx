export default function AddNodeButton({
  onClick,
}: {
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: '#ffffff',
        border: '1px solid #E5E7EB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6B7280',
        fontSize: 14,
        lineHeight: 1,
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      +
    </div>
  );
}
