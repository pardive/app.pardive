export default function StartNode() {
  return (
    <div
      style={{
        width: 50,
        height: 50,
        borderRadius: '50%',
        background: '#3ECF8E', // clean workflow green
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="#ffffff"
        aria-hidden
      >
        <polygon points="8,5 19,12 8,19" />
      </svg>
    </div>
  );
}
