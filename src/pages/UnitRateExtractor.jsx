function UnitRateExtractor() {
  return (
    <div className="min-h-screen bg-black">
      <iframe
        src="https://unitrateextractor-njmmko8xusxzrc7pbbobxe.streamlit.app"
        style={{
          width: '100%',
          height: '100vh',
          border: 'none',
        }}
        title="Unit Rate Extractor"
      />
    </div>
  );
}

export default UnitRateExtractor;