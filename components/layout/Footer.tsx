'use client'

import React from 'react'
import { Facebook, Instagram, Twitter, MessageCircle, Send } from 'lucide-react'

const Footer = () => {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="w-full mt-auto">
            <div className="bg-[#123E52] px-4 sm:px-8 md:px-16 py-4 md:py-3 text-white overflow-hidden shadow-2xl">
                {/* Main Row */}
                <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row flex-wrap justify-between items-center gap-4 mb-3">

                    {/* Help Section */}
                    <div>
                        <h3 className="text-sm font-bold tracking-tight">
                            We're always here to help you...
                        </h3>
                    </div>

                    {/* Hotline Section */}
                    <div className="flex items-center gap-2">
                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">Hotline:</p>
                        <p className="text-xs font-bold font-mono tracking-wide text-white">+1 (800) INNOVATIVE</p>
                    </div>

                    {/* Email Section */}
                    <div className="flex items-center gap-2">
                        <p className="text-white/70 text-[10px] font-bold uppercase tracking-wider">Email:</p>
                        <p className="text-xs font-bold tracking-wide text-white">support@innovativeinsurance.com</p>
                    </div>

                    {/* Social Section */}
                    <div className="flex items-center gap-4">
                        <p className="text-white text-[10px] font-bold uppercase tracking-wider hidden sm:block">Connect with us</p>
                        <div className="flex gap-4 text-white/90">
                            <a href="https://www.facebook.com/moonstarmortgage/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">
                                <Facebook size={14} className="cursor-pointer" />
                            </a>
                            <a href="https://www.instagram.com/moonstarmortgage/" target="_blank" rel="noopener noreferrer" className="hover:text-rose-600 transition-colors">
                                <Instagram size={14} className="cursor-pointer" />
                            </a>
                            <a href="https://www.facebook.com/moonstarmortgage/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 transition-colors">
                                <MessageCircle size={14} className="cursor-pointer" />
                            </a>
                            <a href="https://www.facebook.com/moonstarmortgage/" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600 transition-colors">
                                <Send size={14} className="cursor-pointer" />
                            </a>
                            <a href="https://www.facebook.com/moonstarmortgage/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-800 transition-colors">
                                <Twitter size={14} className="cursor-pointer" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="max-w-[1600px] mx-auto h-[1px] bg-white/5 mb-2"></div>

                {/* Copyright Row */}
                <div className="max-w-[1600px] mx-auto flex justify-center text-center">
                    <p className="text-white/30 text-[9px] font-medium tracking-wide">
                        © {currentYear} Innovative Insurance Solutions | Powered by Innovative Tech
                    </p>
                </div>
            </div>
        </footer>
    )
}

export default Footer
