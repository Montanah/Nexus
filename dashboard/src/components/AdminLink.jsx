const AdminLink = ({ to, onNavigate, preview = false, children, ...props }) => (
  <a
    href={preview ? '/preview/overview' : to}
    {...props}
    onClick={(event) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !onNavigate
      )
        return;
      event.preventDefault();
      onNavigate(to);
    }}
  >
    {children}
  </a>
);
export default AdminLink;
