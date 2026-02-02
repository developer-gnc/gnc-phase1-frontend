function UnitRateExtractor() {
  return (
    <div className="min-h-screen bg-black">
      <iframe
        src="https://unitrateextractor-njmmko8xusxzrc7pbbobxe.streamlit.app/?embed=true"
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
        }}
        title="Unit Rate Extractor"
        allow="cross-origin-isolated"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
}

export default UnitRateExtractor;