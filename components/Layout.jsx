import Navbar from "./Navbar";
import Footer from "./Footer";

const Layout = ({ children }) => {
  return (
    <div>
      <Navbar />
      <main style={styles.main}>{children}</main>
    
    </div>
  );
};

const styles = {
  main: { padding: "20px", minHeight: "100vh" }
};

export default Layout;
