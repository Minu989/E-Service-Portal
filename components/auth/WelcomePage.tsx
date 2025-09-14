import React from 'react';
import { motion, Variants } from 'framer-motion';
import { 
  ArrowRightIcon, 
  WrenchScrewdriverIcon, 
  CalendarIcon,
  PencilIcon,
  UserGroupIcon,
  ChatIcon,
  CheckIcon
} from '../common/icons';

type UserRole = 'technician' | 'customer';

interface WelcomePageProps {
  onSelectRole: (role: UserRole) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string; }> = ({ icon, title, description }) => (
  <motion.div
    variants={itemVariants}
    whileHover={{ y: -8, transition: { duration: 0.2 } }}
    className="p-6 rounded-2xl card-frosted h-full"
  >
    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </motion.div>
);

const StepCard: React.FC<{ icon: React.ReactNode; step: string; title: string; description: string; }> = ({ icon, step, title, description }) => (
  <motion.div variants={itemVariants} className="p-6 h-full text-center">
    <div className="flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-full mb-4 mx-auto relative ring-4 ring-white/50 shadow-lg">
      {icon}
      <span className="absolute -top-2 -right-2 flex items-center justify-center w-8 h-8 bg-blue-600 text-white font-bold text-sm rounded-full border-4 border-slate-100">{step}</span>
    </div>
    <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </motion.div>
);

const TestimonialCard: React.FC<{ quote: string; name: string; service: string; avatar: string; }> = ({ quote, name, service, avatar }) => (
  <motion.div 
    variants={itemVariants} 
    whileHover={{ y: -8, transition: { duration: 0.2 } }}
    className="p-8 rounded-2xl card-frosted h-full flex flex-col relative overflow-hidden"
  >
    <p className="text-6xl font-bold text-blue-200/80 -mt-2 -ml-3 absolute top-0 left-0 opacity-80">“</p>
    <blockquote className="text-gray-700 flex-grow relative z-10">"{quote}"</blockquote>
    <footer className="mt-6 flex items-center">
      <img src={avatar} alt={name} className="w-12 h-12 rounded-full border-2 border-white/80 shadow-sm" />
      <div className="ml-4">
        <p className="font-bold text-gray-800">{name}</p>
        <p className="text-sm text-gray-500">{service}</p>
      </div>
    </footer>
  </motion.div>
);


const RoleButton: React.FC<{ onClick: () => void; title: string; description: string; }> = ({ onClick, title, description }) => (
  <motion.button
    variants={itemVariants}
    whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="text-left w-full p-6 rounded-2xl card-frosted border-2 border-transparent hover:border-blue-500 transition-all duration-300 group"
  >
    <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
    <p className="text-gray-600 mt-1 mb-4">{description}</p>
    <span className="font-semibold text-blue-600 flex items-center group-hover:underline">
      Continue <ArrowRightIcon className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
    </span>
  </motion.button>
);


const WelcomePage: React.FC<WelcomePageProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen animated-gradient-bg overflow-x-hidden">
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <motion.div 
          className="container mx-auto px-6 py-16 text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="bg-blue-600 text-white text-4xl font-bold rounded-2xl p-5 mb-4 inline-block shadow-lg">ES</motion.div>
          <motion.h1 variants={itemVariants} className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Effortless Service, Exceptional Results
          </motion.h1>
          <motion.p variants={itemVariants} className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            The E-Service Portal connects you with expert technicians for all your home and business needs. Get fast, reliable help with our streamlined platform.
          </motion.p>
        </motion.div>
      </div>

      <motion.div 
        className="container mx-auto px-6 py-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2 variants={itemVariants} className="text-4xl font-bold text-center text-gray-800">How It Works</motion.h2>
        <motion.p variants={itemVariants} className="mt-3 text-lg text-gray-600 text-center max-w-2xl mx-auto">A simple, four-step process to solve your problems, quickly and efficiently.</motion.p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mt-16">
            <StepCard 
              icon={<PencilIcon className="w-8 h-8"/>} 
              step="1" 
              title="Describe Your Need" 
              description="Easily submit a service request with our simple form. Provide details and choose a time that works for you." 
            />
            <StepCard 
              icon={<UserGroupIcon className="w-8 h-8"/>} 
              step="2" 
              title="Get Matched" 
              description="Our system instantly matches you with a qualified, available technician best suited for your job." 
            />
            <StepCard 
              icon={<ChatIcon className="w-8 h-8"/>} 
              step="3" 
              title="Communicate & Track" 
              description="Chat directly with your technician, get updates, and track the status of your request in real-time." 
            />
            <StepCard 
              icon={<CheckIcon className="w-8 h-8"/>} 
              step="4" 
              title="Job Done!" 
              description="Once the work is complete, confirm, and leave a review. Simple, transparent, and secure." 
            />
        </div>
      </motion.div>

      <motion.div 
        className="container mx-auto px-6 py-12"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2 variants={itemVariants} className="text-4xl font-bold text-center text-gray-800 mb-12">Platform Features</motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <FeatureCard 
            icon={<WrenchScrewdriverIcon className="w-6 h-6" />}
            title="Efficient Job Management"
            description="Accept, track, and complete service requests with a clear and intuitive dashboard."
          />
          <FeatureCard 
            icon={<CalendarIcon className="w-6 h-6" />}
            title="Automated Scheduling"
            description="Manage your upcoming appointments and keep your schedule organized effortlessly."
          />
        </div>
      </motion.div>
      
      <motion.div 
        className="container mx-auto px-6 py-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2 variants={itemVariants} className="text-4xl font-bold text-center text-gray-800 mb-12">What Our Customers Say</motion.h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <TestimonialCard 
                quote="Booking was incredibly easy and the technician was so professional. My leaky faucet was fixed in under an hour. I'm beyond impressed!" 
                name="Maria Garcia" 
                service="Plumbing Repair" 
                avatar="https://picsum.photos/seed/maria/100/100" 
            />
            <TestimonialCard 
                quote="Finally, a service that respects my time. The scheduling was flexible and the technician arrived right on schedule. Highly recommended!" 
                name="Emily White" 
                service="Electrical Fix" 
                avatar="https://picsum.photos/seed/emily/100/100" 
            />
        </div>
      </motion.div>

      <motion.div 
        className="container mx-auto px-6 py-16"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2 variants={itemVariants} className="text-4xl font-bold text-center text-gray-800 mb-8">Ready to Get Started?</motion.h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <RoleButton 
            onClick={() => onSelectRole('customer')}
            title="I am a Customer"
            description="Request new service, track job status, and communicate with your tech."
          />
           <RoleButton 
            onClick={() => onSelectRole('technician')}
            title="I am a Technician"
            description="Access your dashboard to manage jobs and connect with customers."
          />
        </div>
      </motion.div>

      <footer className="text-center py-8 text-gray-500/80">
        <p>&copy; 2025 E-Service Portal. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default WelcomePage;
