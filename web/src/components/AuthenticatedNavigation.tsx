import { Navbar, Container, Nav, NavLink } from 'react-bootstrap'
import CarSwaddleLogo from './CarSwaddleLogo'

type AuthenticatedNavigationProps = {
    tab?: string,
    onTabSelect?: (tab: string | undefined | null) => void
}

export default function AuthenticatedNavigation({ tab, onTabSelect }: AuthenticatedNavigationProps) {

    const styles = {
        tab: {

        },
        brand: {
            paddingRight: '28px'
        }
    }

    return (
        <Navbar expand="xl" bg="white">
            <Container>
                <Navbar.Brand href="/affiliate" style={styles.brand}>
                    <CarSwaddleLogo height='35px' />
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav activeKey={tab} onSelect={(selectedKey) => {
                        if (onTabSelect) {
                            onTabSelect(selectedKey);
                        }
                    }}>
                        <NavLink style={{ fontWeight: tab === '/affiliate' ? 'bold' : 'normal' }} href="/affiliate" >Affilate</NavLink>
                        <NavLink style={{ fontWeight: tab === '/transactions' ? 'bold' : 'normal' }} href="/transactions">Transactions</NavLink>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )

}


