import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Resize from './pages/Resize';
import Crop from './pages/Crop';
import RotateFlip from './pages/RotateFlip';
import Compress from './pages/Compress';
import Convert from './pages/Convert';
import Editor from './pages/Editor';
import Watermark from './pages/Watermark';
import Border from './pages/Border';
import Metadata from './pages/Metadata';
import Batch from './pages/Batch';
import RemoveBackground from './pages/RemoveBackground';
import Upscale from './pages/Upscale';
import Enhance from './pages/Enhance';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          {/* Fase 3 - Core Tools */}
          <Route path="/resize" element={<Resize />} />
          <Route path="/crop" element={<Crop />} />
          <Route path="/rotate" element={<RotateFlip />} />
          {/* Fase 4 - Compress & Convert */}
          <Route path="/compress" element={<Compress />} />
          <Route path="/convert" element={<Convert />} />
          {/* Fase 5 - Editor */}
          <Route path="/editor" element={<Editor />} />
          {/* Fase 6 - Advanced Tools */}
          <Route path="/watermark" element={<Watermark />} />
          <Route path="/border" element={<Border />} />
          <Route path="/metadata" element={<Metadata />} />
          <Route path="/batch" element={<Batch />} />
          {/* Fase 7 - AI Features */}
          <Route path="/remove-bg" element={<RemoveBackground />} />
          <Route path="/upscale" element={<Upscale />} />
          <Route path="/enhance" element={<Enhance />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
