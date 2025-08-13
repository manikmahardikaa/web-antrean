type Props = React.HTMLAttributes<HTMLDivElement>;

export default function LoginHeader(props: Props) {
  return (
    <div {...props}>
      <h1
        className='text-2xl font-bold mb-2'
        style={{ textAlign: 'center' }}
      >
        Dashboard Admin
      </h1>
      <p
        className='text-gray-500'
        style={{ textAlign: 'center' }}
      >
        Silakan login terlebih dahulu
      </p>
    </div>
  );
}
