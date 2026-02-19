import React from 'react';
import Link from 'next/link';
import { Mail, Phone, MapPin, Building, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-teal-500 via-teal-600 to-blue-600 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          
          {/* Section 1: Company Info */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold bg-white/10 inline-block px-3 py-1 rounded-lg backdrop-blur-sm">
                Moonstar Mortgage
              </h2>
              <p className="text-teal-50 text-sm mt-3 leading-relaxed">
                Trusted mortgage solutions built on <br className="hidden md:block" />
                transparency, speed, and reliability.
              </p>
            </div>
            
            <div className="flex flex-col gap-2 mt-2">
               <div className="flex items-start gap-3 text-sm text-teal-50 hover:text-white transition-colors">
                 <MapPin size={18} className="shrink-0 mt-0.5" />
                 <span>953 N Plum Grove Rd, Unit B,<br/>Schaumburg, IL 60173</span>
               </div>
            </div>
          </div>

          {/* Section 2: Contact & Licensing */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-semibold border-b border-teal-400/30 pb-2 w-fit">
              Contact & Licensing
            </h3>
            
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-3 text-teal-50 hover:text-white transition-colors group">
                <Phone size={16} className="group-hover:scale-110 transition-transform" />
                <div className="flex flex-col gap-0.5">
                    <a href="tel:8472787220" className="hover:underline">(847) 278-7220</a>
                    <a href="tel:8472787221" className="hover:underline">(847) 278-7221</a>
                </div>
              </div>

              <div className="flex items-center gap-3 text-teal-50 hover:text-white transition-colors group">
                <Mail size={16} className="group-hover:scale-110 transition-transform" />
                <a href="mailto:info@moonstarmortgage.com" className="hover:underline">info@moonstarmortgage.com</a>
              </div>
              
              <div className="flex flex-col gap-1 mt-2 text-xs text-teal-100 bg-black/10 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                    <Building size={14} />
                    <span>NMLS: #217352</span>
                </div>
                <div className="flex items-center gap-2">
                    <ShieldCheck size={14} />
                    <span>Illinois License: MB.6759487</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Quick Links & Legal */}
          <div className="flex flex-col gap-4">
             <h3 className="text-base font-semibold border-b border-teal-400/30 pb-2 w-fit">
              Quick Links
            </h3>
            <ul className="flex flex-col gap-2 text-sm text-teal-50">
                <li>
                    <Link href="#" className="hover:text-white hover:underline transition-all flex items-center gap-2">
                        <span>›</span> Privacy Policy
                    </Link>
                </li>
                <li>
                    <Link href="#" className="hover:text-white hover:underline transition-all flex items-center gap-2">
                        <span>›</span> Licensing Information
                    </Link>
                </li>
                <li>
                    <a 
                        href="https://www.nmlsconsumeraccess.org" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-white hover:underline transition-all flex items-center gap-2"
                    >
                        <span>›</span> NMLS Consumer Access ↗
                    </a>
                </li>
            </ul>

            <div className="mt-auto pt-4 md:pt-0">
                 <p className="text-xs text-teal-200">
                    © 2026 Moonstar Mortgage. All rights reserved.
                </p>
                <p className="text-[10px] text-teal-300/80 mt-1">
                    Illinois Residential Mortgage Licensee MB.6759487
                </p>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
