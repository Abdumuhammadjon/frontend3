const Footer = () => {
    return (
      <footer style={styles.footer}>
        <p>© {new Date().getFullYear()} MyApp. All rights reserved.</p>
      </footer>
    );
  };
  
  const styles = {
    footer: { textAlign: "center", padding: "20px", background: "#222", color: "#fff", marginTop: "20px" }
  };
  
  export default Footer;
  