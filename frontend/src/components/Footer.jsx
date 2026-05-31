function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="mt-auto border-t-4 border-zubr-gold bg-zubr-dark text-green-100 py-6">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <p className="font-semibold text-lg">&copy; {year} HP MP TD KF</p>
            </div>
        </footer>
    );
}

export default Footer;
