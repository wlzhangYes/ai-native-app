// Mobile Not Supported Component
// Based on spec.md FR-003: Show error message on mobile devices

export function MobileNotSupported() {
  return (
    <div className="mobile-not-supported">
      <div>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>📱</div>
        <h2>移动端暂不支持</h2>
        <p>
          此应用专为桌面浏览器设计，暂不支持移动设备访问。
          <br />
          请在桌面浏览器中打开以获得最佳体验。
        </p>
        <div
          style={{
            marginTop: '32px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.65)',
          }}
        >
          支持的浏览器：Chrome、Firefox、Safari、Edge
        </div>
      </div>
    </div>
  );
}
