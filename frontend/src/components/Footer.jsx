function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-[#1a2e1b] text-green-100 py-6 mt-auto border-t-4 border-zubr-gold">
            <div className="max-w-7xl mx-auto px-4 text-center">
                <p className="font-semibold text-lg">&copy; {year} Żubr Rider.</p>
            </div>
        </footer>
    );
}

export default Footer;